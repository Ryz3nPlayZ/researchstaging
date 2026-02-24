"""
Chat API for AI Assistant sidebar.
Provides endpoints for chat message persistence and AI responses.
"""
from fastapi import APIRouter, Depends, HTTPException
from auth_dependencies import require_auth
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import logging

from database import get_db, Project, Claim, Finding
from llm_service import llm_service
from agent_service import AgentRouter, ProposedPlan
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"], dependencies=[Depends(require_auth)])


# ============== Pydantic Models ==============

class ChatMessage(BaseModel):
    """Chat message model."""
    id: str
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime
    context: Optional[Dict[str, Any]] = None


class ChatHistoryResponse(BaseModel):
    """Chat history response model."""
    messages: List[ChatMessage]
    total: int


class SendMessageRequest(BaseModel):
    """Send message request model."""
    message: str = Field(..., min_length=1, max_length=10000)
    context: Optional[Dict[str, Any]] = None  # document_id, selection, analysis_id


class SendMessageResponse(BaseModel):
    """Send message response model."""
    user_message: ChatMessage
    ai_response: ChatMessage


class ProposePlanRequest(BaseModel):
    """Propose plan request model."""
    query: str = Field(..., min_length=1, max_length=10000)
    context: Optional[Dict[str, Any]] = None


class ExecutePlanRequest(BaseModel):
    plan: ProposedPlan
    context: Optional[Dict[str, Any]] = None

# ============== Chat Message Table (in-memory for MVP) ==============
# For MVP, we'll use in-memory storage. For production, add ChatMessage model to database.

_chat_messages: Dict[str, List[Dict]] = {}  # project_id -> messages


def _get_project_messages(project_id: str) -> List[Dict]:
    """Get messages for a project."""
    if project_id not in _chat_messages:
        _chat_messages[project_id] = []
    return _chat_messages[project_id]


def _add_message(project_id: str, role: str, content: str, context: Optional[Dict] = None) -> Dict:
    """Add a message to the project's chat history."""
    import uuid
    message = {
        "id": str(uuid.uuid4()),
        "role": role,
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "context": context
    }
    messages = _get_project_messages(project_id)
    messages.append(message)
    # Keep only last 100 messages per project
    if len(messages) > 100:
        _chat_messages[project_id] = messages[-100:]
    return message


# ============== Context Injection ==============


def _tiptap_to_plain_text(node: Any) -> str:
    """Extract plain text from TipTap JSON for context when content_latex is not set."""
    if not node:
        return ""
    if isinstance(node, dict):
        if node.get("text"):
            return node["text"]
        content = node.get("content") or []
        sep = "\n" if node.get("type") == "paragraph" else ""
        return sep.join(_tiptap_to_plain_text(c) for c in content)
    return ""


def _normalize_citation_style(style_value: Optional[object]) -> Optional[str]:
    if style_value is None:
        return None
    if hasattr(style_value, "value"):
        return str(style_value.value).lower()
    raw = str(style_value).strip()
    if raw in {"apa", "mla", "chicago"}:
        return raw
    if raw in {"APA", "MLA", "CHICAGO"}:
        return raw.lower()
    if raw.startswith("CitationStyle."):
        return raw.split(".")[-1].lower()
    return raw.lower() if raw else None


async def inject_context(
    project_id: str,
    document_id: Optional[str],
    query: str,
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Gather relevant context for AI response.

    Context sources:
    - Document content if document_id provided
    - Recent claims from memory
    - Recent findings from analysis
    - User preferences

    Args:
        project_id: Project ID
        document_id: Optional document ID
        query: User's query (for relevance filtering)
        db: Database session

    Returns:
        Dictionary with context data
    """
    context = {}

    # Document content: include source string (content_latex or plain text from TipTap) so AI writes in same format
    if document_id:
        from database.models import Document
        doc_result = await db.execute(
            select(Document).where(Document.id == document_id)
        )
        document = doc_result.scalar_one_or_none()
        if document:
            content_source = document.content_latex if document.content_latex else _tiptap_to_plain_text(document.content)
            context['document'] = {
                'title': document.title,
                'content': document.content,  # TipTap JSON (legacy)
                'content_source': content_source,  # LaTeX/Markdown+math or plain text for AI to read/write
                'citation_style': _normalize_citation_style(document.citation_style)
            }
            context['document_id'] = document_id
            logger.info(f"Loaded document context: {document.title}")

    # Recent claims (last 20, high confidence)
    try:
        claim_result = await db.execute(
            select(Claim)
            .where(Claim.project_id == project_id)
            .where(Claim.confidence >= 0.5)
            .order_by(Claim.relevance_score.desc())
            .limit(20)
        )
        claims = claim_result.scalars().all()
        if claims:
            context['claims'] = [
                {
                    'text': c.claim_text,
                    'type': c.claim_type,
                    'confidence': c.confidence,
                    'relevance': c.relevance_score
                }
                for c in claims
            ]
            logger.info(f"Loaded {len(claims)} claims for context")
    except Exception as e:
        logger.warning(f"Failed to load claims for context: {e}")

    # Recent findings
    try:
        finding_result = await db.execute(
            select(Finding)
            .where(Finding.project_id == project_id)
            .order_by(Finding.significance.desc().nulls_last())
            .limit(10)
        )
        findings = finding_result.scalars().all()
        if findings:
            context['findings'] = [
                {
                    'type': f.finding_type,
                    'summary': f.finding_text,
                    'significance': f.significance
                }
                for f in findings
            ]
            logger.info(f"Loaded {len(findings)} findings for context")
    except Exception as e:
        logger.warning(f"Failed to load findings for context: {e}")

    # User preferences
    try:
        from database import Preference
        pref_result = await db.execute(
            select(Preference).where(Preference.project_id == project_id)
        )
        preferences = pref_result.scalars().all()

        if preferences:
            prefs_dict = {}
            for pref in preferences:
                if pref.category not in prefs_dict:
                    prefs_dict[pref.category] = {}
                prefs_dict[pref.category][pref.key] = pref.value

            context['preferences'] = {
                'domains': prefs_dict.get('relevance', {}).get('domain_preferences', []),
                'topics': prefs_dict.get('relevance', {}).get('topic_keywords', [])
            }
            logger.info(f"Loaded user preferences for context")
    except Exception as e:
        logger.warning(f"Failed to load preferences for context: {e}")

    # Conversation History
    try:
        messages = _get_project_messages(project_id)
        if messages:
            # Exclude the very last one which is the current query
            recent = messages[-11:-1] if len(messages) > 1 else []
            if recent:
                context['history'] = [{"role": m["role"], "content": m["content"]} for m in recent]
                logger.info(f"Loaded {len(recent)} messages for history context")
    except Exception as e:
        logger.warning(f"Failed to load history for context: {e}")

    return context


def build_system_prompt(context: dict) -> str:
    """
    Build comprehensive system prompt with context.

    Args:
        context: Context dictionary from inject_context()

    Returns:
        System prompt string
    """
    base = """You are a Research Intelligence Agent — an expert assistant embedded in a research workspace. You help researchers write documents, analyze data, find literature, and make sense of their work.

## CAPABILITIES
- Write and edit LaTeX/Markdown documents with academic rigor
- Search and synthesize scientific literature
- Generate and debug Python/R analysis code
- Create documents, manage files, and organize research artifacts
- Track claims and their provenance across sources

## STYLE
- Be concise and direct — researchers are busy
- Use academic language when writing content, plain language when chatting
- Always cite sources when making factual claims
- Use LaTeX notation for math: $inline$ and $$block$$
- When generating code, include comments explaining the approach

## CONSTRAINTS
- Stay within the project's research scope
- Never fabricate citations or data
- When unsure, say so and suggest how to verify
- Keep responses under 500 words unless writing full sections

## ACTIONS
When the user asks you to create a document, include this tag in your response:
[ACTION:CREATE_DOC|Document Title Here]

When asked to modify a document, reference it by name and provide the content to insert."""

    if 'document' in context:
        base += f"\n\n## CURRENT DOCUMENT\nTitle: {context['document']['title']}"
        if context['document'].get('citation_style'):
            base += f"\nCitation Style: {context['document']['citation_style']}"
        content_source = context['document'].get('content_source')
        if content_source:
            base += f"\n\nDocument source (write in this format — Markdown/LaTeX; use $...$ and $$...$$ for math):\n{content_source[:8000]}"
        elif context['document'].get('content'):
            content_preview = str(context['document']['content'])[:2000]
            base += f"\nContent Preview: {content_preview}"

    if context.get('claims'):
        claims_text = "\n".join([f"- {c['text']} (confidence: {c['confidence']:.0%})" for c in context['claims'][:10]])
        base += f"\n\n## RESEARCH CLAIMS ({len(context['claims'])} total)\n{claims_text}"

    if context.get('findings'):
        findings_text = "\n".join([f"- [{f['type']}] {f['summary']}" for f in context['findings'][:5]])
        base += f"\n\n## ANALYSIS FINDINGS\n{findings_text}"

    if context.get('preferences'):
        topics = context['preferences'].get('topics', [])
        if topics:
            base += f"\n\nUser research interests: {', '.join(topics[:5])}"

    return base


# ============== Endpoints ==============

@router.get("/projects/{project_id}/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    project_id: str,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    Get chat message history for a project.

    Args:
        project_id: Project ID
        limit: Maximum number of messages to return (default: 50)
        offset: Number of messages to skip (default: 0)

    Returns:
        Chat history with messages sorted by timestamp (newest last)
    """
    # Verify project exists
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get messages
    messages = _get_project_messages(project_id)

    # Apply pagination
    total = len(messages)
    paginated_messages = messages[offset:offset + limit]

    return ChatHistoryResponse(
        messages=[
            ChatMessage(
                id=msg["id"],
                role=msg["role"],
                content=msg["content"],
                timestamp=datetime.fromisoformat(msg["timestamp"]),
                context=msg.get("context")
            )
            for msg in paginated_messages
        ],
        total=total
    )


@router.post("/projects/{project_id}/propose-plan")
async def propose_plan(
    project_id: str,
    request: ProposePlanRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Propose a plan for complex multi-step actions.

    Returns 404 if the query is simple (no plan needed).
    Returns ProposedPlan if complex action detected.

    Args:
        project_id: Project ID
        request: Query and optional context

    Returns:
        Proposed plan with steps, or 404 if simple query
    """
    # Verify project exists
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Inject context
    document_id = request.context.get("document_id") if request.context else None
    context = await inject_context(
        project_id=project_id,
        document_id=document_id,
        query=request.query,
        db=db
    )

    try:
        # Create agent router
        agent_router = AgentRouter(llm_service)

        # Generate plan
        plan = await agent_router.propose_plan(
            query=request.query,
            context=context
        )

        # Return 404 if no plan (simple query)
        if plan is None:
            raise HTTPException(
                status_code=404,
                detail="No plan needed. This query can be handled directly."
            )

        return plan

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to propose plan: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate plan: {str(e)}"
        )


@router.post("/projects/{project_id}/execute-plan")
async def execute_plan(
    project_id: str,
    request: ExecutePlanRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Execute an approved plan step-by-step.

    Args:
        project_id: Project ID
        request: Request with plan and context


    Returns:
        List of step execution results
    """
    # Verify project exists
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    plan = request.plan
    # Inject context
    context = await inject_context(
        project_id=project_id,
        document_id=request.context.get("document_id") if request.context else None,
        query=plan.goal,
        db=db
    )

    try:
        # Create agent router with db context for autonomous execution
        agent_router = AgentRouter(llm_service, db=db, project_id=project_id)

        # Execute plan
        results = await agent_router.execute_plan(
            plan=plan,
            context=context
        )

        return {
            "goal": plan.goal,
            "results": results,
            "total_steps": len(plan.steps),
            "completed_steps": len([r for r in results if r.get("status") == "completed"])
        }

    except Exception as e:
        logger.error(f"Failed to execute plan: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute plan: {str(e)}"
        )


@router.post("/projects/{project_id}/send", response_model=SendMessageResponse)
async def send_message(
    project_id: str,
    request: SendMessageRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Send a chat message and get AI response.

    Args:
        project_id: Project ID
        request: Message and optional context

    Returns:
        User message and AI response
    """
    # Verify project exists
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Store user message
    user_message_dict = _add_message(
        project_id,
        "user",
        request.message,
        request.context
    )

    # Inject context
    document_id = request.context.get("document_id") if request.context else None
    client_context = request.context or {}
    context = await inject_context(
        project_id=project_id,
        document_id=document_id,
        query=request.message,
        db=db
    )
    
    # Include client-provided context (tool instructions, etc.)
    context['client_context'] = client_context

    try:
        # Create agent router with db context for autonomous execution
        agent_router = AgentRouter(llm_service, db=db, project_id=project_id)

        # Route to appropriate agent
        agent_response = await agent_router.route(
            query=request.message,
            context=context
        )

        ai_response_text = agent_response.response

        if not ai_response_text:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable. Please configure an LLM API key."
            )

        # Add context_used to AI message
        ai_context = (request.context or {}).copy()
        ai_context['context_used'] = agent_response.context_used

        # Store AI response
        ai_message_dict = _add_message(
            project_id,
            "assistant",
            ai_response_text,
            ai_context
        )

        return SendMessageResponse(
            user_message=ChatMessage(
                id=user_message_dict["id"],
                role=user_message_dict["role"],
                content=user_message_dict["content"],
                timestamp=datetime.fromisoformat(user_message_dict["timestamp"]),
                context=user_message_dict.get("context")
            ),
            ai_response=ChatMessage(
                id=ai_message_dict["id"],
                role=ai_message_dict["role"],
                content=ai_message_dict["content"],
                timestamp=datetime.fromisoformat(ai_message_dict["timestamp"]),
                context=ai_message_dict.get("context")
            )
        )

    except Exception as e:
        logger.error(f"Failed to generate AI response: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate response: {str(e)}"
        )


@router.delete("/projects/{project_id}/history")
async def clear_chat_history(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Clear chat history for a project.

    Args:
        project_id: Project ID

    Returns:
        Success message
    """
    # Verify project exists
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Clear messages
    _chat_messages[project_id] = []

    return {"message": "Chat history cleared"}


# ============== Simple Chat Endpoint (MVP - No Project Required) ==============

class SimpleChatRequest(BaseModel):
    """Simple chat request model (no project required)."""
    message: str = Field(..., min_length=1, max_length=10000)
    agent_type: str = Field(default="general", description="Agent type: document, literature, memory, general")
    context: Optional[str] = Field(None, description="Optional document context (HTML content)")


class SimpleChatResponse(BaseModel):
    """Simple chat response model."""
    response: str
    agent_type: str
    sources: Optional[List[str]] = None


@router.post("/chat", response_model=SimpleChatResponse)
async def simple_chat(request: SimpleChatRequest):
    """
    Simple chat endpoint without project requirement.

    Routes to multi-agent orchestration system based on agent_type.
    For MVP, uses in-memory context without database persistence.

    Args:
        request: Chat message with agent type and optional context

    Returns:
        AI response from the specified agent
    """
    try:
        # Create agent router
        agent_router = AgentRouter(llm_service)

        # Build minimal context
        context = {}
        if request.context:
            context['document'] = {
                'content': request.context,
                'title': 'Current Document'
            }

        # Route to appropriate agent
        # Note: For explicit agent_type, we'll bypass the keyword-based routing
        # and directly use the specified agent
        response_text = await _route_to_agent(
            agent_router=agent_router,
            agent_type=request.agent_type,
            query=request.message,
            context=context
        )

        if not response_text:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable. Please configure an LLM API key."
            )

        return SimpleChatResponse(
            response=response_text,
            agent_type=request.agent_type,
            sources=None
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate AI response: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate response: {str(e)}"
        )


async def _route_to_agent(
    agent_router: AgentRouter,
    agent_type: str,
    query: str,
    context: dict
) -> str:
    """
    Route query to specific agent by type.

    Args:
        agent_router: AgentRouter instance
        agent_type: Target agent type (document, literature, memory, general)
        query: User query
        context: Context dictionary

    Returns:
        Agent response text
    """
    # Map agent type string to agent class
    from agent_service import DocumentAgent, LiteratureAgent, MemoryAgent, GeneralAgent

    agent_map = {
        'document': DocumentAgent,
        'literature': LiteratureAgent,
        'memory': MemoryAgent,
        'general': GeneralAgent,
    }

    agent_class = agent_map.get(agent_type.lower(), GeneralAgent)
    agent = agent_class(llm_service)

    try:
        response = await agent.handle(query, context)
        return response
    except Exception as e:
        logger.error(f"Agent {agent_type} failed: {e}", exc_info=True)
        return f"Sorry, the {agent_type} agent encountered an error. Please try again."

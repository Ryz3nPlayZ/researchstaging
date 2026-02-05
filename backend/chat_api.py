"""
Chat API for AI Assistant sidebar.
Provides endpoints for chat message persistence and AI responses.
"""
from fastapi import APIRouter, Depends, HTTPException
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

router = APIRouter(prefix="/api/chat", tags=["chat"])


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

    # Document content
    if document_id:
        from database import Document
        doc_result = await db.execute(
            select(Document).where(Document.id == document_id)
        )
        document = doc_result.scalar_one_or_none()
        if document:
            context['document'] = {
                'title': document.title,
                'content': document.content,  # TipTap JSON
                'citation_style': document.citation_style.value if document.citation_style else None
            }
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

    return context


def build_system_prompt(context: dict) -> str:
    """
    Build system prompt with context.

    Args:
        context: Context dictionary from inject_context()

    Returns:
        System prompt string
    """
    base = "You are a helpful research assistant."

    if 'document' in context:
        base += f"\n\n# Current Document\nTitle: {context['document']['title']}"
        if context['document'].get('citation_style'):
            base += f"\nCitation Style: {context['document']['citation_style']}"

    if context.get('claims'):
        base += f"\n\n# Research Context\nThe project has {len(context['claims'])} extracted claims from literature."

    if context.get('preferences'):
        topics = context['preferences'].get('topics', [])
        if topics:
            base += f"\n\nUser interests: {', '.join(topics[:5])}"

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
    plan: ProposedPlan,
    db: AsyncSession = Depends(get_db)
):
    """
    Execute an approved plan step-by-step.

    Args:
        project_id: Project ID
        plan: Approved ProposedPlan

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

    # Inject context
    context = await inject_context(
        project_id=project_id,
        document_id=None,
        query=plan.goal,
        db=db
    )

    try:
        # Create agent router
        agent_router = AgentRouter(llm_service)

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
    context = await inject_context(
        project_id=project_id,
        document_id=document_id,
        query=request.message,
        db=db
    )

    try:
        # Create agent router
        agent_router = AgentRouter(llm_service)

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

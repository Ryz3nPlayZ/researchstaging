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

from database import get_db, Project
from llm_service import llm_service

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

async def _build_context_prompt(
    project_id: str,
    user_context: Optional[Dict[str, Any]],
    db: AsyncSession
) -> str:
    """
    Build system prompt with context injection.

    Context sources:
    - Project research goal and metadata
    - Document content if document_id provided
    - Recent claims/findings from memory
    - User preferences
    """
    context_parts = []

    # Get project context
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()

    if project:
        context_parts.append(f"# Research Context\n")
        context_parts.append(f"Research Goal: {project.research_goal}\n")
        context_parts.append(f"Output Type: {project.output_type.value}\n")
        if project.audience:
            context_parts.append(f"Target Audience: {project.audience}\n")
        context_parts.append("\n")

    # Document context
    if user_context and "document_id" in user_context:
        from database import Document
        doc_result = await db.execute(
            select(Document).where(Document.id == user_context["document_id"])
        )
        document = doc_result.scalar_one_or_none()
        if document:
            context_parts.append(f"# Current Document\n")
            context_parts.append(f"Title: {document.title}\n")
            # Add selected text if provided
            if user_context.get("selection"):
                context_parts.append(f"Selected Text: {user_context['selection']}\n")
            context_parts.append("\n")

    # Load recent claims from memory
    try:
        from database import Claim
        claim_result = await db.execute(
            select(Claim)
            .where(Claim.project_id == project_id)
            .order_by(Claim.relevance_score.desc())
            .limit(10)
        )
        claims = claim_result.scalars().all()
        if claims:
            context_parts.append(f"# Key Findings from Memory\n")
            for claim in claims[:5]:  # Top 5 relevant claims
                context_parts.append(f"- {claim.claim_text}\n")
            context_parts.append("\n")
    except Exception as e:
        logger.warning(f"Failed to load claims for context: {e}")

    # Combine into system prompt
    if context_parts:
        system_prompt = "".join(context_parts)
        system_prompt += "\nYou are a helpful research assistant. Use the context above to provide relevant, accurate assistance."
        return system_prompt

    return "You are a helpful research assistant."


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

    # Build context-aware prompt
    system_prompt = await _build_context_prompt(project_id, request.context, db)

    # Get chat history for conversation context
    messages = _get_project_messages(project_id)
    conversation_history = messages[-10:] if len(messages) > 1 else []  # Last 10 messages for context

    try:
        # Call LLM service
        full_prompt = f"{system_prompt}\n\n"
        if conversation_history:
            full_prompt += "Previous conversation:\n"
            for msg in conversation_history[-5:]:  # Last 5 messages for context
                full_prompt += f"{msg['role']}: {msg['content']}\n"
            full_prompt += "\n"

        full_prompt += f"user: {request.message}\nassistant:"

        ai_response_text = await llm_service.generate(full_prompt)

        if not ai_response_text:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable. Please configure an LLM API key."
            )

        # Store AI response
        ai_message_dict = _add_message(
            project_id,
            "assistant",
            ai_response_text,
            request.context
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

"""
Onboarding Service — Dedicated backend intelligence for project creation.

Replaces the old approach of stuffing a system prompt into the user message
field from the frontend. This module owns:
  1. The comprehensive system prompt that tells the LLM exactly what it is,
     what Research Pilot can do, and what data to collect.
  2. Per-session conversation memory so the LLM gets proper multi-turn context.
  3. Server-side action parsing (no more fenced JSON block parsing on the client).
"""

import json
import logging
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

from llm_service import llm_service

logger = logging.getLogger(__name__)


# ============== Session Store ==============

_onboarding_sessions: Dict[str, List[Dict[str, str]]] = {}


def _get_session(session_id: str) -> List[Dict[str, str]]:
    if session_id not in _onboarding_sessions:
        _onboarding_sessions[session_id] = []
    return _onboarding_sessions[session_id]


def _clear_session(session_id: str) -> None:
    _onboarding_sessions.pop(session_id, None)


# ============== Request / Response Models ==============

class OnboardingChatRequest(BaseModel):
    session_id: str = Field(..., description="Client-generated UUID for this onboarding conversation")
    message: str = Field(..., min_length=1, max_length=5000)


class OnboardingAction(BaseModel):
    type: Literal["create_project"] = Field(..., description="Action type: create_project")
    research_goal: str
    output_type: Optional[str] = None
    audience: Optional[str] = None
    additional_context: Optional[str] = None


class OnboardingChatResponse(BaseModel):
    response: str = Field(..., description="Display text for the user (action JSON stripped)")
    action: Optional[OnboardingAction] = None
    session_id: str


# ============== System Prompt ==============

ONBOARDING_SYSTEM_PROMPT = """You are Onboarding Wizard, made by the Research Pilot team.

Your job: help the user set up a new project quickly.
Right now: this is onboarding only. You are not a general chatbot.

Research Pilot is an execution system that takes a research goal and runs a pipeline to produce structured outputs. After creation, the workspace handles tasks, literature, files, analysis, and documents.

BEHAVIOR
1) Treat the user's first concrete message as the project goal.
2) Respond like a wizard: "Great — I'll help you set up a new project for ..."
3) Do not use filler phrases like "Thanks for sharing your topic".
4) Do not ask repetitive obvious questions.
5) Ask at most one follow-up if absolutely needed.
6) Never ask about datasets, methods, variables, research gaps, or hypotheses in onboarding.

REQUIRED FIELDS FOR CREATE ACTION
- research_goal
- output_type
- audience
- additional_context (optional)

VALID output_type values:
- literature_review
- research_paper
- systematic_review
- meta_analysis
- thesis_chapter
- research_brief
- analysis_report

VALID audience values:
- academic
- industry
- general_public
- policymakers
- students

DEFAULTS (when user doesn't specify):
- output_type = literature_review
- audience = academic

ACTION FORMAT
When you are ready to create, include this marker and JSON:

|||CREATE_PROJECT|||
{"research_goal":"...","output_type":"...","audience":"...","additional_context":"..."}

RULES
- Keep user-facing response short and direct.
- If the user gave a clear goal, create in the same turn.
- If user asks to change output/audience, update and recreate action.
- Output valid single-line JSON after marker.
"""


# ============== Action Parser ==============

_ACTION_MARKER = "|||CREATE_PROJECT|||"
_MAX_SESSION_MESSAGES = 24
_ALLOWED_OUTPUT_TYPES = {
    "literature_review",
    "research_paper",
    "systematic_review",
    "meta_analysis",
    "thesis_chapter",
    "research_brief",
    "analysis_report",
}
_ALLOWED_AUDIENCES = {
    "academic",
    "industry",
    "general_public",
    "policymakers",
    "students",
}


def _parse_action(text: str) -> tuple[str, Optional[OnboardingAction]]:
    """Parse the LLM response to extract the display text and optional action.

    Returns (display_text, action_or_none).
    """
    if _ACTION_MARKER not in text:
        return text.strip(), None

    parts = text.split(_ACTION_MARKER, 1)
    display_text = parts[0].strip()
    json_part = parts[1].strip()

    try:
        data = _extract_first_json_object(json_part)
        if data:
            action = _normalize_action_payload(data)
            if action and action.research_goal:
                return display_text, action
    except Exception as e:
        logger.warning(f"Failed to parse onboarding action JSON: {e}")

    return display_text, None


def _extract_first_json_object(raw: str) -> Optional[Dict[str, object]]:
    decoder = json.JSONDecoder()
    for idx, char in enumerate(raw):
        if char != "{":
            continue
        try:
            obj, _ = decoder.raw_decode(raw[idx:])
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            continue
    return None


def _normalize_action_payload(data: Dict[str, object]) -> Optional[OnboardingAction]:
    raw_goal = str(data.get("research_goal", "")).strip()
    if not raw_goal:
        return None

    raw_output = str(data.get("output_type", "")).strip().lower()
    raw_audience = str(data.get("audience", "")).strip().lower()
    raw_context = data.get("additional_context")

    output_type = raw_output if raw_output in _ALLOWED_OUTPUT_TYPES else "literature_review"
    audience = raw_audience if raw_audience in _ALLOWED_AUDIENCES else "academic"

    additional_context = None
    if isinstance(raw_context, str) and raw_context.strip():
        additional_context = raw_context.strip()

    return OnboardingAction(
        type="create_project",
        research_goal=raw_goal,
        output_type=output_type,
        audience=audience,
        additional_context=additional_context,
    )


# ============== Core Handler ==============

async def handle_onboarding_message(
    session_id: str,
    user_message: str,
) -> OnboardingChatResponse:
    """Process a user message in the onboarding conversation.

    Maintains per-session history, sends the comprehensive system prompt,
    and parses the response for create_project actions.
    """
    history = _get_session(session_id)

    # Append user message
    history.append({"role": "user", "content": user_message})
    if len(history) > _MAX_SESSION_MESSAGES:
        history[:] = history[-_MAX_SESSION_MESSAGES:]

    # Build the prompt with full conversation context
    # The LLM service only supports (system_message, prompt) — not a messages array.
    # So we format the conversation history into the prompt.
    conversation_block = "\n".join(
        f"{'User' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}"
        for msg in history
    )

    prompt = f"""## CONVERSATION
{conversation_block}

Respond as the Project Onboarding Agent. Follow your system instructions exactly."""

    raw_response: Optional[str] = None
    last_error: Optional[Exception] = None
    for _ in range(2):
        try:
            raw_response = await llm_service.generate(
                prompt=prompt,
                system_message=ONBOARDING_SYSTEM_PROMPT,
            )
            break
        except Exception as e:
            last_error = e
            logger.warning(f"Onboarding LLM call attempt failed: {e}")

    if not raw_response:
        logger.error(f"Onboarding LLM call failed after retries: {last_error}", exc_info=True)
        raw_response = (
            "Let’s get this set up. Are you starting a brand-new project, "
            "or continuing with existing papers, notes, or drafts?"
        )

    # Parse out the action (if any) and clean display text.
    # Wrapper behavior: LLM decides the conversational flow, backend validates action payload.
    display_text, action = _parse_action(raw_response)

    # Store assistant response in session (clean text only)
    history.append({"role": "assistant", "content": display_text})

    # If we successfully parsed a create action, we can clean up the session
    if action:
        _clear_session(session_id)

    return OnboardingChatResponse(
        response=display_text,
        action=action,
        session_id=session_id,
    )

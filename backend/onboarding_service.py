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

ONBOARDING_SYSTEM_PROMPT = """You are the Project Onboarding Agent for Research Pilot.

## WHAT RESEARCH PILOT IS

Research Pilot is an AI-native research execution system. It transforms a research goal into a structured, defensible output through an automated pipeline: literature discovery across academic databases, PDF acquisition, claim extraction with provenance, thematic synthesis, and document drafting — all with full auditability.

The user works in a project workspace with tabs for: Overview (task pipeline), Documents (write/edit with AI), Literature (search, score, compare papers), Files (uploads), Analysis (Python/R code), and Provenance (claim graph).

## WHAT HAPPENS AFTER CREATION

When you create a project, Research Pilot automatically:
- Creates a multi-phase plan (Discovery -> Acquisition -> Synthesis -> Output)
- Expands that plan into executable tasks with dependencies
- Runs literature discovery across Semantic Scholar, arXiv, OpenAlex, CORE, and Springer Nature
- Acquires and parses available PDFs, then extracts structured claims with provenance
- Builds synthesis artifacts and drafts output documents in the selected format

This means onboarding should focus on scoping the project correctly, not collecting implementation details.

## YOUR JOB

You are the first thing a user sees. Your job is to understand what they need and set up the right project. DO NOT make assumptions about what they want — discover it through conversation.

### Step 1: Understand what they're starting from

The user may be:
- **Starting fresh** — They have a topic or research question and want the system to find literature, synthesize findings, and produce a document from scratch.
- **Continuing existing work** — They already have papers, data, notes, or a draft they want to import and build on. The system can ingest their materials and augment their work.

If it's not clear from their first message, ask a brief question to clarify.

### Step 2: Collect or infer the essentials

You need 3 things before creating a project. Infer them when confidence is high; ask only for what is missing:

1. **Research goal** — What they want to research. A clear topic, question, or objective. Can be informal.

2. **Output type** — What kind of document to produce. Infer when explicit, otherwise suggest and confirm quickly.
   - `literature_review` — Thematic synthesis, 4,000–8,000 words. Best for surveying a field.
   - `research_paper` — IMRaD structure, 6,000–10,000 words. Best with a hypothesis or data.
   - `systematic_review` — PRISMA-P/Cochrane style, 8,000–15,000 words. Rigorous evidence synthesis.
   - `meta_analysis` — Quantitative synthesis pooling results across studies.
   - `thesis_chapter` — Academic thesis format. Best for dissertation work.
   - `research_brief` — Executive summary, 1,500–3,000 words. Quick overview for decision-makers.
   - `analysis_report` — Data-focused analytical report.

3. **Audience** — Who the output is for. Infer when obvious, otherwise ask in one short phrase.
   - `academic` — Researchers, scholars, peer reviewers
   - `industry` — Practitioners, R&D teams, professionals
   - `general_public` — Non-specialists, educated general readers
   - `policymakers` — Government, regulatory bodies
   - `students` — Undergraduate or graduate students

If the user mentions additional constraints (time range, geographic focus, subdisciplines, exclusion criteria), capture them as additional_context.

## CONVERSATION RULES

- **Avoid hardcoded defaults.** Do not silently force literature_review/academic. Infer from context; if uncertain, use a recommendation the user can override in one short reply.
- **You CAN bundle questions.** Ask both output type and audience in one message. Just don't assume the answers.
- **Be conversational and brief.** 2-3 sentences max. No bullet lists, no markdown headers, no numbered steps. Speak like a senior colleague in a quick chat.
- **Be fast once you have enough.** If the user gives you all 3 pieces in one message, create the project immediately. Don't ask for confirmation of things they already stated.
- **Understand informal language.** "yeah", "sure", "yep", "ok", "sounds good", "go for it" all mean YES. "nah", "no", "actually", "change that" mean the user wants to adjust.
- **Treat the first message as a research goal** if it reads like a topic or question. Infer what you can, ask only for missing pieces.
- **Don't lecture.** You are scoping a project, not answering the research question.
- **Don't over-ask.** 2-3 questions total max before creating.
- **Stay in onboarding scope.** Do not answer domain questions in depth. Keep the user moving toward project creation.
- **Prefer decisive recommendations with confirmation.** You may suggest a likely output type/audience, but always ask for confirmation if the user did not explicitly choose.
- **Keep responses compact and professional.** No decorative language, emojis, or hype phrasing.
- **Do not use empty acknowledgements.** Never start with phrases like "Thanks for sharing your topic" or similar filler.
- **Do not ask obvious onboarding questions every turn.** If the user already gave a research goal, do not re-ask whether they have a topic. Move forward.
- **Wizard mode behavior:** Assume "starting fresh" unless the user explicitly mentions existing artifacts (papers, notes, drafts, data). Do not ask "starting fresh vs importing" unless there is clear ambiguity.

## WHAT YOU MUST NOT ASK

These are unknowable before literature review — never ask about them:
- Specific datasets, methods, or methodologies
- Variables to analyze
- Research gaps or hypotheses
- Analytical approaches

## ACTION FORMAT

When you have all 3 pieces of information, end your response with the action marker:

|||CREATE_PROJECT|||
{"research_goal": "...", "output_type": "...", "audience": "...", "additional_context": "..."}

Rules:
- Valid JSON on a single line after the marker.
- `research_goal`: Clean, well-phrased version of what the user wants.
- `output_type`: One of: literature_review, research_paper, systematic_review, meta_analysis, thesis_chapter, research_brief, analysis_report
- `audience`: One of: academic, industry, general_public, policymakers, students
- `additional_context`: Optional — only if user mentioned constraints.
- Never output the marker and then ask another question.

## EXAMPLES

Example 1 — User gives a clear topic (2 exchanges):
User: "I want to research how LLMs are changing scientific discovery"
You: "Great topic. What kind of output are you after — a literature review, a research paper, or something else? And who's the audience — academic, industry, general?"

User: "lit review, academic"
You: "Got it — creating a literature review on LLMs in scientific discovery for academic readers now.

|||CREATE_PROJECT|||
{"research_goal": "How large language models are transforming scientific discovery across domains", "output_type": "literature_review", "audience": "academic"}"

Example 2 — User specifies everything upfront (1 exchange):
User: "systematic review of AI tutoring systems in K-12, post-2020, for academic publication"
You: "Perfect — a systematic review on AI tutoring in K-12 education, post-2020 studies, for academic readers. Setting that up.

|||CREATE_PROJECT|||
{"research_goal": "Systematic review of AI-based tutoring systems in K-12 education", "output_type": "systematic_review", "audience": "academic", "additional_context": "Focus on post-2020 studies only. Scope limited to K-12 education."}"

Example 3 — User is continuing existing work:
User: "I have a bunch of papers on gene therapy I've already collected, want to write a review"
You: "Nice — so you want to build on papers you already have. I'll set up a literature review on gene therapy — you can upload your PDFs and notes once the workspace opens. Who's the audience for this?"

User: "academic, for a journal submission"
You: "Creating a literature review on gene therapy for academic readers. You'll be able to import your papers right in the workspace.

|||CREATE_PROJECT|||
{"research_goal": "Literature review on gene therapy", "output_type": "literature_review", "audience": "academic", "additional_context": "User has existing papers to import. Intended for journal submission."}"

Example 4 — Vague first message:
User: "help me with a project"
You: "Sure — what topic are you researching? And are you starting from scratch, or do you have existing papers and notes you want to build on?"
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
_AFFIRM_WORDS = {
    "yes", "yeah", "yep", "sure", "ok", "okay", "sounds good", "go for it", "do it", "works", "that works"
}

_OUTPUT_HINTS = {
    "systematic_review": ["systematic review", "prisma", "cochrane"],
    "meta_analysis": ["meta analysis", "meta-analysis", "pooled effect", "effect size"],
    "research_paper": ["research paper", "imrad", "paper"],
    "thesis_chapter": ["thesis", "dissertation", "chapter"],
    "research_brief": ["brief", "executive summary", "one pager", "one-pager"],
    "analysis_report": ["analysis report", "report", "dashboard report"],
    "literature_review": ["literature review", "lit review", "review"],
}

_AUDIENCE_HINTS = {
    "academic": ["academic", "journal", "peer review", "peer-reviewed", "conference"],
    "industry": ["industry", "practitioner", "business", "team", "r&d"],
    "general_public": ["general public", "non-technical", "layperson", "everyone"],
    "policymakers": ["policy", "policymaker", "government", "regulator"],
    "students": ["students", "class", "course", "undergrad", "graduate"],
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

    output_type = raw_output if raw_output in _ALLOWED_OUTPUT_TYPES else None
    audience = raw_audience if raw_audience in _ALLOWED_AUDIENCES else None

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


def _infer_from_text(user_text: str) -> tuple[Optional[str], Optional[str], Optional[str]]:
    text = user_text.lower()
    inferred_output = None
    inferred_audience = None
    inferred_context = None

    for output_type, hints in _OUTPUT_HINTS.items():
        if any(hint in text for hint in hints):
            inferred_output = output_type
            break

    for audience, hints in _AUDIENCE_HINTS.items():
        if any(hint in text for hint in hints):
            inferred_audience = audience
            break

    if "post-" in text or "since " in text or "only" in text or "focus on" in text or "exclude" in text:
        inferred_context = user_text.strip()

    if not inferred_output:
        inferred_output = "literature_review"
    if not inferred_audience:
        inferred_audience = "academic"

    return inferred_output, inferred_audience, inferred_context


def _collect_user_text(history: List[Dict[str, str]]) -> str:
    return "\n".join(msg["content"] for msg in history if msg["role"] == "user")


def _looks_like_affirmation(text: str) -> bool:
    lowered = text.lower().strip()
    return any(phrase in lowered for phrase in _AFFIRM_WORDS)


def _build_missing_info_prompt(missing_output: bool, missing_audience: bool) -> str:
    if missing_output and missing_audience:
        return (
            "Great — I can set this up right away. What output format do you want "
            "(literature review, research paper, systematic review, meta-analysis, thesis chapter, research brief, or analysis report), "
            "and who is the audience?"
        )
    if missing_output:
        return (
            "Perfect. What output format should I generate: literature review, research paper, systematic review, "
            "meta-analysis, thesis chapter, research brief, or analysis report?"
        )
    return "Who is this for: academic, industry, students, policymakers, or general public?"


def _sanitize_assistant_copy(text: str) -> str:
    cleaned = text.strip()
    if cleaned.lower().startswith("thanks for sharing your topic"):
        cleaned = "Got it. " + cleaned.split(".", 1)[-1].strip()
    if cleaned.lower().startswith("thanks for sharing"):
        cleaned = "Got it. " + cleaned.split(".", 1)[-1].strip()
    return cleaned


def _is_probable_research_goal(text: str) -> bool:
    stripped = text.strip()
    if len(stripped) < 12:
        return False
    lowered = stripped.lower()
    non_goal_prefixes = (
        "help", "hi", "hello", "what can", "how do", "can you", "hey",
    )
    if any(lowered.startswith(prefix) for prefix in non_goal_prefixes):
        return False
    return True


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

    # Parse out the action (if any) and clean display text
    display_text, action = _parse_action(raw_response)

    # Make onboarding feel adaptive: infer missing slots before creating.
    if action:
        user_text = _collect_user_text(history)
        inferred_output, inferred_audience, inferred_context = _infer_from_text(user_text)

        if not action.output_type:
            action.output_type = inferred_output
        if not action.audience:
            action.audience = inferred_audience

        if not action.additional_context and inferred_context:
            action.additional_context = inferred_context

        missing_output = not action.output_type
        missing_audience = not action.audience

        # If the model tried to create too early, ask only for missing fields.
        if missing_output or missing_audience:
            action = None
            display_text = _build_missing_info_prompt(missing_output, missing_audience)

    # Wizard mode: if model did not emit action but user gave a concrete goal,
    # create immediately with inferred recommendation defaults.
    if not action and _is_probable_research_goal(user_message) and not _looks_like_affirmation(user_message):
        inferred_output, inferred_audience, inferred_context = _infer_from_text(user_message)
        action = OnboardingAction(
            type="create_project",
            research_goal=user_message.strip(),
            output_type=inferred_output,
            audience=inferred_audience,
            additional_context=inferred_context,
        )
        display_text = (
            f"Got it — I’ll set this up as a {inferred_output.replace('_', ' ')} "
            f"for an {inferred_audience.replace('_', ' ')} audience. Creating it now."
        )

    # If user affirmed a previous recommendation, reuse inferred slots from history.
    if not action and _looks_like_affirmation(user_message):
        user_text = _collect_user_text(history)
        inferred_output, inferred_audience, inferred_context = _infer_from_text(user_text)

        # Only auto-create on affirmation if we can infer all required fields.
        if inferred_output and inferred_audience:
            goal_text = next((msg["content"] for msg in history if msg["role"] == "user" and len(msg["content"].strip()) > 12), "")
            if goal_text:
                action = OnboardingAction(
                    type="create_project",
                    research_goal=goal_text.strip(),
                    output_type=inferred_output,
                    audience=inferred_audience,
                    additional_context=inferred_context,
                )
                if not display_text:
                    display_text = "Great — creating your project now."

    display_text = _sanitize_assistant_copy(display_text)

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

"""
Planning Service - LLM-driven research planning flow.
Handles step-by-step guided project creation and plan generation.
"""
import logging
from typing import Optional, Dict, Any, List
from enum import Enum
from pydantic import BaseModel, Field
import json

from llm_service import llm_service

logger = logging.getLogger(__name__)


class PlanningStep(str, Enum):
    RESEARCH_GOAL = "research_goal"
    OUTPUT_TYPE = "output_type"
    AUDIENCE = "audience"
    SCOPE = "scope"
    REVIEW = "review"
    COMPLETE = "complete"


class StepOption(BaseModel):
    """An option in a planning step."""
    id: str
    label: str
    description: Optional[str] = None


class PlanningStepResponse(BaseModel):
    """Response for a planning step."""
    step: PlanningStep
    question: str
    description: Optional[str] = None
    options: List[StepOption] = Field(default_factory=list)
    allow_custom: bool = True
    required: bool = True


class ResearchPlan(BaseModel):
    """Generated research plan."""
    title: str
    summary: str
    scope: str
    output_type: str
    audience: str
    phases: List[Dict[str, Any]]
    estimated_papers: int
    search_terms: List[str]
    key_themes: List[str]


class PlanningService:
    """Service for guided research planning."""
    
    def __init__(self):
        self.steps_config = {
            PlanningStep.RESEARCH_GOAL: {
                "question": "What research question or topic would you like to explore?",
                "description": "Describe your research goal in detail. The more specific, the better the results.",
                "options": [],
                "allow_custom": True,
                "required": True
            },
            PlanningStep.OUTPUT_TYPE: {
                "question": "What type of output would you like to produce?",
                "description": "Choose the format that best fits your needs.",
                "options": [
                    {"id": "literature_review", "label": "Literature Review", "description": "A comprehensive synthesis of existing research on your topic"},
                    {"id": "research_paper", "label": "Research Paper", "description": "A structured academic paper with introduction, methods, results, and discussion"},
                    {"id": "brief", "label": "Research Brief", "description": "A concise summary of key findings for quick consumption"},
                ],
                "allow_custom": False,
                "required": True
            },
            PlanningStep.AUDIENCE: {
                "question": "Who is the intended audience for this research?",
                "description": "This helps tailor the language and depth appropriately.",
                "options": [
                    {"id": "academic", "label": "Academic Researchers", "description": "Detailed, technical language with full citations"},
                    {"id": "professional", "label": "Industry Professionals", "description": "Applied focus with practical implications"},
                    {"id": "policy", "label": "Policy Makers", "description": "Clear recommendations and policy implications"},
                    {"id": "general", "label": "General Audience", "description": "Accessible language without jargon"},
                ],
                "allow_custom": True,
                "required": False
            },
            PlanningStep.SCOPE: {
                "question": "How broad should the literature search be?",
                "description": "This affects the number of sources and depth of analysis.",
                "options": [
                    {"id": "focused", "label": "Focused (10-20 papers)", "description": "Quick, targeted review of key sources"},
                    {"id": "standard", "label": "Standard (20-40 papers)", "description": "Balanced coverage of the topic"},
                    {"id": "comprehensive", "label": "Comprehensive (40+ papers)", "description": "Extensive review for thorough analysis"},
                ],
                "allow_custom": False,
                "required": True
            }
        }
    
    def get_step(self, step: PlanningStep) -> PlanningStepResponse:
        """Get configuration for a planning step."""
        config = self.steps_config.get(step)
        if not config:
            raise ValueError(f"Unknown planning step: {step}")
        
        return PlanningStepResponse(
            step=step,
            question=config["question"],
            description=config.get("description"),
            options=[StepOption(**opt) for opt in config.get("options", [])],
            allow_custom=config.get("allow_custom", True),
            required=config.get("required", True)
        )
    
    def get_next_step(self, current_step: Optional[PlanningStep], answers: Dict[str, Any]) -> Optional[PlanningStep]:
        """Determine the next step in the planning flow."""
        step_order = [
            PlanningStep.RESEARCH_GOAL,
            PlanningStep.OUTPUT_TYPE,
            PlanningStep.AUDIENCE,
            PlanningStep.SCOPE,
            PlanningStep.REVIEW
        ]
        
        if current_step is None:
            return step_order[0]
        
        try:
            current_index = step_order.index(current_step)
            if current_index < len(step_order) - 1:
                return step_order[current_index + 1]
            return PlanningStep.COMPLETE
        except ValueError:
            return None
    
    async def generate_plan(self, answers: Dict[str, Any]) -> ResearchPlan:
        """Generate a research plan based on collected answers."""
        
        research_goal = answers.get("research_goal", "")
        output_type = answers.get("output_type", "literature_review")
        audience = answers.get("audience", "academic")
        scope = answers.get("scope", "standard")
        
        # Use LLM to generate detailed plan
        system_message = """You are a research planning expert. Generate detailed, actionable research plans.
Your plans should be specific, feasible, and appropriate for the given scope and audience.
Do not ask about datasets, methods, or variables - focus on literature review and synthesis tasks."""
        
        scope_papers = {"focused": 15, "standard": 30, "comprehensive": 50}
        estimated_papers = scope_papers.get(scope, 30)
        
        prompt = f"""Create a detailed research plan for the following:

Research Goal: {research_goal}
Output Type: {output_type.replace('_', ' ')}
Target Audience: {audience}
Scope: {scope} (approximately {estimated_papers} papers)

Generate a JSON response with this exact structure:
{{
    "title": "A compelling title for the research output",
    "summary": "A 2-3 sentence summary of what this research will accomplish",
    "scope": "Brief description of the scope and boundaries",
    "phases": [
        {{
            "name": "Phase name",
            "description": "What this phase accomplishes",
            "tasks": [
                {{
                    "name": "Task name",
                    "type": "literature_search|pdf_acquisition|summarization|reference_extraction|synthesis|drafting",
                    "description": "Task description",
                    "dependencies": []
                }}
            ]
        }}
    ],
    "search_terms": ["term1", "term2", "term3"],
    "key_themes": ["theme1", "theme2", "theme3"]
}}

Focus on literature review and synthesis tasks only. Do not include data collection or experimental tasks."""
        
        try:
            response = await llm_service.generate(prompt, system_message)
            
            # Parse JSON from response
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end > start:
                plan_data = json.loads(response[start:end])
                
                return ResearchPlan(
                    title=plan_data.get("title", research_goal[:100]),
                    summary=plan_data.get("summary", ""),
                    scope=plan_data.get("scope", scope),
                    output_type=output_type,
                    audience=audience,
                    phases=plan_data.get("phases", []),
                    estimated_papers=estimated_papers,
                    search_terms=plan_data.get("search_terms", []),
                    key_themes=plan_data.get("key_themes", [])
                )
        except Exception as e:
            logger.error(f"Failed to generate plan: {e}")
        
        # Fallback to default plan
        return self._create_default_plan(research_goal, output_type, audience, scope, estimated_papers)
    
    def _create_default_plan(
        self,
        research_goal: str,
        output_type: str,
        audience: str,
        scope: str,
        estimated_papers: int
    ) -> ResearchPlan:
        """Create a default research plan structure."""
        return ResearchPlan(
            title=f"Research on: {research_goal[:80]}",
            summary=f"This {output_type.replace('_', ' ')} will explore {research_goal} through systematic literature review and synthesis.",
            scope=f"{scope.capitalize()} review of approximately {estimated_papers} relevant papers",
            output_type=output_type,
            audience=audience,
            phases=[
                {
                    "name": "Literature Discovery",
                    "description": "Search and collect relevant academic papers",
                    "tasks": [
                        {
                            "name": "Semantic Scholar Search",
                            "type": "literature_search",
                            "description": "Search Semantic Scholar for relevant papers",
                            "dependencies": []
                        },
                        {
                            "name": "arXiv Search",
                            "type": "literature_search", 
                            "description": "Search arXiv for preprints",
                            "dependencies": []
                        }
                    ]
                },
                {
                    "name": "Content Acquisition",
                    "description": "Download and process paper contents",
                    "tasks": [
                        {
                            "name": "PDF Download",
                            "type": "pdf_acquisition",
                            "description": "Download available PDFs",
                            "dependencies": ["Semantic Scholar Search", "arXiv Search"]
                        },
                        {
                            "name": "Reference Extraction",
                            "type": "reference_extraction",
                            "description": "Extract citations from papers",
                            "dependencies": ["PDF Download"]
                        }
                    ]
                },
                {
                    "name": "Analysis & Synthesis",
                    "description": "Analyze and synthesize findings",
                    "tasks": [
                        {
                            "name": "Paper Summarization",
                            "type": "summarization",
                            "description": "Generate summaries of each paper",
                            "dependencies": ["PDF Download"]
                        },
                        {
                            "name": "Literature Synthesis",
                            "type": "synthesis",
                            "description": "Synthesize findings across papers",
                            "dependencies": ["Paper Summarization"]
                        }
                    ]
                },
                {
                    "name": "Document Production",
                    "description": "Draft the final document",
                    "tasks": [
                        {
                            "name": "Document Drafting",
                            "type": "drafting",
                            "description": f"Draft the {output_type.replace('_', ' ')}",
                            "dependencies": ["Literature Synthesis"]
                        }
                    ]
                }
            ],
            estimated_papers=estimated_papers,
            search_terms=[],
            key_themes=[]
        )


# Singleton instance
planning_service = PlanningService()

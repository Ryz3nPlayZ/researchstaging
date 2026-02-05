"""
Data Analysis API endpoints for code generation and execution.
Provides AI-powered code generation for Python and R data analysis.
"""
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from agent_service import AnalysisAgent
from llm_service import llm_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

# ============== Request/Response Models ==============

class CodeGenerationRequest(BaseModel):
    """Request for code generation."""
    task: str = Field(..., description="Description of the analysis task")
    language: str = Field(..., description="Programming language: 'python' or 'r'")
    data_context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional information about available data"
    )


class CodeGenerationResponse(BaseModel):
    """Response from code generation."""
    code: str = Field(..., description="Generated code")
    language: str = Field(..., description="Language of the generated code")
    explanation: str = Field(..., description="Explanation of the approach")


# ============== Dependencies ==============

def get_analysis_agent():
    """Get or create AnalysisAgent instance."""
    return AnalysisAgent(llm_service)


# ============== Endpoints ==============

@router.post("/projects/{project_id}/generate-code", response_model=CodeGenerationResponse)
async def generate_code(
    project_id: int,
    request: CodeGenerationRequest,
    agent: AnalysisAgent = Depends(get_analysis_agent)
):
    """
    Generate analysis code for a given task.

    Args:
        project_id: Project ID (for context/tracking)
        request: Code generation request with task, language, and optional data context

    Returns:
        Generated code with explanation

    Raises:
        400: Invalid language parameter
        500: LLM service error
    """
    # Validate language
    language_lower = request.language.lower()
    if language_lower not in ["python", "r"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid language '{request.language}'. Supported languages: 'python', 'r'"
        )

    try:
        # Generate code using AnalysisAgent
        result = await agent.generate_code(
            task_description=request.task,
            language=language_lower,
            data_context=request.data_context
        )

        logger.info(
            f"Generated {result['language']} code for project {project_id}: "
            f"{len(result['code'])} characters"
        )

        return CodeGenerationResponse(**result)

    except ValueError as e:
        # Raised for unsupported language
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.error(f"Code generation failed for project {project_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate code: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for analysis service."""
    return {"status": "healthy", "service": "analysis"}

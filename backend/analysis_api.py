"""
Data Analysis API endpoints for code generation and execution.
Provides AI-powered code generation for Python and R data analysis.
"""
import logging
from typing import Dict, Any, Optional, Literal
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from agent_service import AnalysisAgent
from llm_service import llm_service
from execution_service import execution_service
from memory_service import MemoryService
from database import get_db

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


class CodeExecutionRequest(BaseModel):
    """Request for code execution."""
    code: str = Field(..., min_length=1, max_length=10000, description="Code to execute")
    language: Literal["python", "r"] = Field(..., description="Programming language")
    save_to_memory: bool = Field(
        default=True,
        description="Save results to memory as findings"
    )


class CodeExecutionResponse(BaseModel):
    """Response from code execution."""
    success: bool = Field(..., description="Whether execution succeeded")
    output: str = Field(..., description="Standard output from execution")
    error: str = Field(..., description="Standard error from execution")
    execution_time: float = Field(..., description="Execution time in seconds")
    finding_id: Optional[str] = Field(None, description="ID of saved finding (if applicable)")


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


@router.post("/projects/{project_id}/execute", response_model=CodeExecutionResponse)
async def execute_code(
    project_id: str,
    request: CodeExecutionRequest,
    db = Depends(get_db)
):
    """
    Execute Python or R code in a sandboxed environment.

    Args:
        project_id: Project ID (for context/memory storage)
        request: Code execution request with code, language, and save preference
        db: Database session (for saving results to memory)

    Returns:
        Execution result with output, errors, and finding ID if saved

    Raises:
        400: Invalid language, empty code, or code exceeds max length
        413: Code exceeds maximum length
        500: Execution service error
    """
    # Language is already validated by Pydantic Literal
    language = request.language.lower()

    try:
        # Execute code using ExecutionService
        if language == "python":
            result = await execution_service.execute_python(request.code)
        elif language == "r":
            result = await execution_service.execute_r(request.code)
        else:
            # This should never happen due to Pydantic validation
            raise HTTPException(
                status_code=400,
                detail=f"Invalid language '{request.language}'. Supported: 'python', 'r'"
            )

        logger.info(
            f"Executed {language} code for project {project_id}: "
            f"success={result.success}, time={result.execution_time:.2f}s"
        )

        # Save to memory if requested and execution succeeded
        finding_id = None
        if request.save_to_memory and result.success:
            try:
                memory_service = MemoryService(db)

                # Create a finding from the execution result
                finding_text = f"Code execution output ({language})"
                if result.output:
                    finding_text += f"\n\n{result.output[:500]}"

                finding = await memory_service.create_finding(
                    project_id=project_id,
                    finding_text=finding_text,
                    source_analysis_id=f"exec_{project_id}_{int(result.execution_time)}",
                    analysis_type=f"{language}_analysis",
                    finding_type="code_execution",
                    finding_data={
                        "code": request.code,
                        "language": language,
                        "output": result.output,
                        "execution_time": result.execution_time,
                    },
                )
                finding_id = finding.id
                logger.info(f"Saved execution result to finding {finding_id}")

            except Exception as e:
                # Don't fail the request if memory save fails
                logger.warning(f"Failed to save execution to memory: {e}")

        return CodeExecutionResponse(
            success=result.success,
            output=result.output,
            error=result.error,
            execution_time=result.execution_time,
            finding_id=finding_id
        )

    except ValueError as e:
        # Raised for invalid code (too long, empty, etc.)
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.error(f"Code execution failed for project {project_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute code: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for analysis service."""
    return {"status": "healthy", "service": "analysis"}

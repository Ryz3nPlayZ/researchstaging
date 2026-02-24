"""
Data Analysis API endpoints for code generation and execution.
Provides AI-powered code generation for Python and R data analysis.
"""
import logging
from typing import Dict, Any, Optional, Literal
from fastapi import APIRouter, HTTPException, Depends
from auth_dependencies import require_auth
from pydantic import BaseModel, Field

from agent_service import AnalysisAgent
from llm_service import llm_service
from execution_service import execution_service
from memory_service import MemoryService
from database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analysis", tags=["analysis"], dependencies=[Depends(require_auth)])

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
    project_id: str,
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


@router.get("/results/{finding_id}/download")
async def download_analysis_result(
    finding_id: str,
    format: str = "txt",
    db = Depends(get_db)
):
    """
    Download analysis result in various formats.

    Args:
        finding_id: ID of the finding to download
        format: Download format (csv, txt, json)
        db: Database session

    Returns:
        File download with appropriate Content-Type header

    Raises:
        404: Finding not found
        400: Invalid format parameter
    """
    # Validate format
    if format not in ["csv", "txt", "json"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format '{format}'. Supported: csv, txt, json"
        )

    try:
        # Retrieve finding from memory
        memory_service = MemoryService(db)
        finding = await memory_service.get_finding(finding_id)

        if not finding:
            raise HTTPException(
                status_code=404,
                detail=f"Finding {finding_id} not found"
            )

        # Extract output data
        finding_data = finding.finding_data or {}
        output = finding_data.get("output", "")

        # Format response based on requested format
        if format == "json":
            from fastapi.responses import JSONResponse
            return JSONResponse(
                content={
                    "id": finding.id,
                    "finding_text": finding.finding_text,
                    "finding_type": finding.finding_type,
                    "analysis_type": finding.analysis_type,
                    "data": finding_data,
                    "created_at": finding.created_at.isoformat(),
                }
            )

        elif format == "csv":
            # Try to parse output as CSV data
            import io
            import csv

            # Check if output contains structured data
            if "output" in finding_data:
                output_text = finding_data["output"]

                # Try to parse as CSV
                try:
                    reader = csv.reader(io.StringIO(output_text))
                    rows = list(reader)

                    if rows:
                        from fastapi.responses import Response
                        csv_output = io.StringIO()
                        writer = csv.writer(csv_output)
                        writer.writerows(rows)

                        return Response(
                            content=csv_output.getvalue(),
                            media_type="text/csv",
                            headers={
                                "Content-Disposition": f"attachment; filename=analysis_{finding_id}.csv"
                            }
                        )
                except Exception:
                    pass

            # Fallback: return as text
            from fastapi.responses import Response
            return Response(
                content=output_text,
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=analysis_{finding_id}.csv"
                }
            )

        else:  # format == "txt"
            # Return raw output as text
            from fastapi.responses import Response
            content = output if output else finding.finding_text

            return Response(
                content=content,
                media_type="text/plain",
                headers={
                    "Content-Disposition": f"attachment; filename=analysis_{finding_id}.txt"
                }
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download failed for finding {finding_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download result: {str(e)}"
        )


@router.get("/results/{finding_id}/visualize")
async def visualize_analysis_result(
    finding_id: str,
    db = Depends(get_db)
):
    """
    Get structured visualization data for an analysis result.

    Args:
        finding_id: ID of the finding to visualize
        db: Database session

    Returns:
        Structured data with visualization type, data, and chart config

    Raises:
        404: Finding not found
    """
    try:
        # Retrieve finding from memory
        memory_service = MemoryService(db)
        finding = await memory_service.get_finding(finding_id)

        if not finding:
            raise HTTPException(
                status_code=404,
                detail=f"Finding {finding_id} not found"
            )

        # Extract data from finding
        finding_data = finding.finding_data or {}
        output = finding_data.get("output", "")

        # Detect visualization type from output
        viz_type = "text"
        viz_data = {"output": output}
        chart_config = None

        # Try to parse as CSV
        import csv
        import io
        try:
            reader = csv.DictReader(io.StringIO(output))
            rows = list(reader)

            if rows and len(rows) > 0:
                viz_type = "table"
                viz_data = {
                    "headers": reader.fieldnames or [],
                    "rows": rows,
                    "rowCount": len(rows),
                }

                # Suggest chart type if numeric data present
                numeric_cols = []
                for col in (reader.fieldnames or []):
                    if any(row.get(col) and str(row.get(col)).replace(".", "").replace("-", "").isdigit() for row in rows[:10]):
                        numeric_cols.append(col)

                if numeric_cols:
                    chart_config = {
                        "recommendedType": "scatter",
                        "xColumn": (reader.fieldnames or [])[0],
                        "yColumns": numeric_cols[:5],
                        "availableTypes": ["scatter", "line", "bar", "histogram"],
                    }

        except Exception:
            # Not CSV, check for JSON
            try:
                import json
                json_data = json.loads(output)

                if isinstance(json_data, list) and len(json_data) > 0:
                    viz_type = "table"
                    viz_data = {
                        "headers": list(json_data[0].keys()) if isinstance(json_data[0], dict) else [],
                        "rows": json_data,
                        "rowCount": len(json_data),
                    }
                elif isinstance(json_data, dict):
                    viz_type = "chart"
                    viz_data = json_data
                    chart_config = {"recommendedType": "auto"}
                else:
                    viz_data = {"data": json_data}

            except Exception:
                # Default to text
                viz_type = "text"
                viz_data = {"output": output}

        return {
            "type": viz_type,
            "data": viz_data,
            "chart_config": chart_config,
            "finding": {
                "id": finding.id,
                "type": finding.finding_type,
                "analysis_type": finding.analysis_type,
                "created_at": finding.created_at.isoformat(),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Visualization failed for finding {finding_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to visualize result: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for analysis service."""
    return {"status": "healthy", "service": "analysis"}

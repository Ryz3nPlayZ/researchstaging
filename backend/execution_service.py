"""
Sandboxed code execution service for Python and R.
Executes user-submitted code in isolated subprocesses with timeout protection.
"""
import subprocess
import logging
import tempfile
import os
from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

logger = logging.getLogger(__name__)


# ============== Data Models ==============

class ExecutionResult(BaseModel):
    """Result from code execution."""
    success: bool
    output: str
    error: str
    execution_time: float
    return_code: int


# ============== Execution Service ==============

class ExecutionService:
    """
    Service for executing Python and R code in sandboxed subprocesses.

    Security considerations:
    - Code runs in isolated subprocess (not main process)
    - Timeout protection prevents runaway code
    - Working directory limited to /tmp
    - Code length limits prevent abuse
    - Output capture prevents resource exhaustion

    For production: Consider Docker containers, VMs, or cloud execution environments.
    """

    def __init__(
        self,
        default_timeout: int = 60,
        max_code_length: int = 10000,
        max_output_length: int = 100000
    ):
        """
        Initialize execution service.

        Args:
            default_timeout: Default execution timeout in seconds
            max_code_length: Maximum code length to prevent abuse
            max_output_length: Maximum output length to capture
        """
        self.default_timeout = default_timeout
        self.max_code_length = max_code_length
        self.max_output_length = max_output_length

    async def execute_python(
        self,
        code: str,
        timeout: Optional[int] = None
    ) -> ExecutionResult:
        """
        Execute Python code in a sandboxed subprocess.

        Args:
            code: Python code to execute
            timeout: Execution timeout in seconds (default: 60)

        Returns:
            ExecutionResult with output, errors, and execution time

        Raises:
            ValueError: If code is too long or empty
        """
        # Validate code
        if not code or not code.strip():
            raise ValueError("Code cannot be empty")

        if len(code) > self.max_code_length:
            raise ValueError(
                f"Code exceeds maximum length of {self.max_code_length} characters"
            )

        # Use default timeout if not specified
        exec_timeout = timeout or self.default_timeout

        # Create temporary working directory
        with tempfile.TemporaryDirectory() as temp_dir:
            start_time = datetime.now()

            try:
                # Build command: python3 -c "code"
                command = ["python3", "-c", code]

                # Execute in subprocess with timeout
                result = subprocess.run(
                    command,
                    cwd=temp_dir,
                    capture_output=True,
                    timeout=exec_timeout,
                    text=True,
                    env=self._get_sandboxed_env()
                )

                # Calculate execution time
                execution_time = (datetime.now() - start_time).total_seconds()

                # Capture and limit output
                stdout = self._limit_output(result.stdout)
                stderr = self._limit_output(result.stderr)

                # Return success result
                return ExecutionResult(
                    success=(result.returncode == 0),
                    output=stdout,
                    error=stderr,
                    execution_time=execution_time,
                    return_code=result.returncode
                )

            except subprocess.TimeoutExpired as e:
                # Execution timed out
                execution_time = (datetime.now() - start_time).total_seconds()
                logger.warning(f"Python execution timed out after {exec_timeout}s")

                # Try to get any partial output
                stdout = ""
                stderr = f"Execution timed out after {exec_timeout} seconds"
                if e.stdout:
                    stdout = self._limit_output(e.stdout.decode('utf-8', errors='replace'))
                if e.stderr:
                    stderr += "\n" + self._limit_output(e.stderr.decode('utf-8', errors='replace'))

                return ExecutionResult(
                    success=False,
                    output=stdout,
                    error=stderr,
                    execution_time=execution_time,
                    return_code=-1
                )

            except subprocess.SubprocessError as e:
                # Other subprocess errors
                execution_time = (datetime.now() - start_time).total_seconds()
                logger.error(f"Python execution failed: {e}")

                return ExecutionResult(
                    success=False,
                    output="",
                    error=f"Execution failed: {str(e)}",
                    execution_time=execution_time,
                    return_code=-1
                )

            except Exception as e:
                # Unexpected errors
                execution_time = (datetime.now() - start_time).total_seconds()
                logger.error(f"Unexpected error during Python execution: {e}", exc_info=True)

                return ExecutionResult(
                    success=False,
                    output="",
                    error=f"Unexpected error: {str(e)}",
                    execution_time=execution_time,
                    return_code=-1
                )

    async def execute_r(
        self,
        code: str,
        timeout: Optional[int] = None
    ) -> ExecutionResult:
        """
        Execute R code in a sandboxed subprocess.

        Args:
            code: R code to execute
            timeout: Execution timeout in seconds (default: 60)

        Returns:
            ExecutionResult with output, errors, and execution time

        Raises:
            ValueError: If code is too long or empty
        """
        # Validate code
        if not code or not code.strip():
            raise ValueError("Code cannot be empty")

        if len(code) > self.max_code_length:
            raise ValueError(
                f"Code exceeds maximum length of {self.max_code_length} characters"
            )

        # Use default timeout if not specified
        exec_timeout = timeout or self.default_timeout

        # Create temporary working directory
        with tempfile.TemporaryDirectory() as temp_dir:
            start_time = datetime.now()

            try:
                # Build command: Rscript -e "code"
                command = ["Rscript", "-e", code]

                # Execute in subprocess with timeout
                result = subprocess.run(
                    command,
                    cwd=temp_dir,
                    capture_output=True,
                    timeout=exec_timeout,
                    text=True,
                    env=self._get_sandboxed_env()
                )

                # Calculate execution time
                execution_time = (datetime.now() - start_time).total_seconds()

                # Capture and limit output
                stdout = self._limit_output(result.stdout)
                stderr = self._limit_output(result.stderr)

                # Return success result
                return ExecutionResult(
                    success=(result.returncode == 0),
                    output=stdout,
                    error=stderr,
                    execution_time=execution_time,
                    return_code=result.returncode
                )

            except subprocess.TimeoutExpired as e:
                # Execution timed out
                execution_time = (datetime.now() - start_time).total_seconds()
                logger.warning(f"R execution timed out after {exec_timeout}s")

                # Try to get any partial output
                stdout = ""
                stderr = f"Execution timed out after {exec_timeout} seconds"
                if e.stdout:
                    stdout = self._limit_output(e.stdout.decode('utf-8', errors='replace'))
                if e.stderr:
                    stderr += "\n" + self._limit_output(e.stderr.decode('utf-8', errors='replace'))

                return ExecutionResult(
                    success=False,
                    output=stdout,
                    error=stderr,
                    execution_time=execution_time,
                    return_code=-1
                )

            except subprocess.SubprocessError as e:
                # Other subprocess errors
                execution_time = (datetime.now() - start_time).total_seconds()
                logger.error(f"R execution failed: {e}")

                return ExecutionResult(
                    success=False,
                    output="",
                    error=f"Execution failed: {str(e)}",
                    execution_time=execution_time,
                    return_code=-1
                )

            except Exception as e:
                # Unexpected errors
                execution_time = (datetime.now() - start_time).total_seconds()
                logger.error(f"Unexpected error during R execution: {e}", exc_info=True)

                return ExecutionResult(
                    success=False,
                    output="",
                    error=f"Unexpected error: {str(e)}",
                    execution_time=execution_time,
                    return_code=-1
                )

    def _get_sandboxed_env(self) -> Dict[str, str]:
        """
        Get a sandboxed environment for subprocess execution.

        Limits environment variables to prevent access to sensitive paths.
        """
        # Keep minimal environment for execution
        safe_env = {
            "PATH": os.environ.get("PATH", ""),
            "HOME": "/tmp",
            "TMPDIR": "/tmp",
            "LANG": "en_US.UTF-8",
            "LC_ALL": "en_US.UTF-8",
        }

        # Python-specific
        safe_env["PYTHONIOENCODING"] = "utf-8"

        # R-specific (if R is installed)
        if "R_HOME" in os.environ:
            safe_env["R_HOME"] = os.environ["R_HOME"]

        return safe_env

    def _limit_output(self, output: str) -> str:
        """
        Limit output length to prevent resource exhaustion.

        Args:
            output: Raw output string

        Returns:
            Limited output string with truncation notice if needed
        """
        if len(output) <= self.max_output_length:
            return output

        # Truncate and add notice
        return (
            output[:self.max_output_length] +
            f"\n\n[Output truncated: exceeded {self.max_output_length} characters]"
        )


# ============== Singleton Instance ==============

# Create a singleton instance for use across the application
execution_service = ExecutionService()

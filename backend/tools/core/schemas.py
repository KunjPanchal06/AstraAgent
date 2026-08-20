from pydantic import BaseModel, Field
from typing import Any, Optional
from datetime import datetime, timezone
import time
from functools import wraps

class ToolOutput(BaseModel):
    """
    Base schema for all tool outputs.
    Ensures a standardized contract for the ReAct agent and LangGraph orchestrator.
    """
    success: bool = Field(..., description="Whether the tool execution was successful.")
    tool_name: str = Field(..., description="The name of the tool that was executed.")
    data: Optional[Any] = Field(None, description="The actual output data from the tool, if successful. Type varies by tool.")
    error_message: Optional[str] = Field(None, description="Detailed error message if the execution failed.")
    execution_time_ms: float = Field(..., description="Time taken to execute the tool in milliseconds.")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of the execution.")


class BaseTool(BaseModel):
    """
    Base class that all tool implementations should inherit from.
    Provides the required metadata (name, description) and a standardized execute method.
    """
    name: str = Field(..., description="Unique name of the tool, used by the LLM to select it.")
    description: str = Field(..., description="Detailed description of what the tool does and its inputs. Critical for ReAct.")

    def execute(self, *args, **kwargs) -> ToolOutput:
        """
        The main method to be overridden by subclasses.
        Should return a structured ToolOutput.
        """
        raise NotImplementedError("Tool implementations must override the execute method.")

def with_execution_timer(func):
    """
    Optional decorator to automatically wrap tool execution in a standardized timer
    and handle basic try/except logic to always return a ToolOutput.
    """
    @wraps(func)
    def wrapper(self, *args, **kwargs) -> ToolOutput:
        start_time = time.time()
        try:
            # We assume the underlying function returns the 'data' part, 
            # and we construct the ToolOutput around it.
            result_data = func(self, *args, **kwargs)
            execution_time_ms = (time.time() - start_time) * 1000
            
            return ToolOutput(
                success=True,
                tool_name=self.name,
                data=result_data,
                execution_time_ms=execution_time_ms
            )
        except Exception as e:
            execution_time_ms = (time.time() - start_time) * 1000
            return ToolOutput(
                success=False,
                tool_name=self.name,
                error_message=str(e),
                execution_time_ms=execution_time_ms
            )
    return wrapper

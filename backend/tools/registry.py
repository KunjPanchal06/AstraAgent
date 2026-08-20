import logging
import time
from typing import Dict, List, Any
from .core.schemas import BaseTool, ToolOutput
from .implementations.calculator_tool import CalculatorTool
from .implementations.wikipedia_tool import WikipediaTool
from .implementations.sql_tool import SQLQueryTool
from .implementations.web_search_tool import WebSearchTool
from .implementations.repl_tool import PythonREPLTool

# Setup basic logging for the registry
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ToolRegistry")

TOOL_REGISTRY: Dict[str, BaseTool] = {}

def _initialize_registry():
    """
    Instantiates all tools and populates the TOOL_REGISTRY dict.
    Gracefully handles missing environment variables for third-party API tools.
    """
    global TOOL_REGISTRY
    TOOL_REGISTRY.clear()
    
    tools_to_init = [
        CalculatorTool(),
        WikipediaTool(),
        SQLQueryTool(db_path="sample_data.db"), # Sensible default assuming root execution
        PythonREPLTool()
    ]
    
    # Try to initialize WebSearchTool, but handle missing API key gracefully
    try:
        tools_to_init.append(WebSearchTool())
    except ValueError as e:
        logger.warning(f"WebSearchTool could not be initialized and will be excluded: {e}")
        
    for tool in tools_to_init:
        TOOL_REGISTRY[tool.name] = tool

# Initialize immediately upon module import
_initialize_registry()

def get_tool(name: str) -> BaseTool:
    """
    Looks up a tool by name. Raises a ValueError if it doesn't exist.
    """
    if name not in TOOL_REGISTRY:
        raise ValueError(f"Tool '{name}' is not registered. Available tools: {list(TOOL_REGISTRY.keys())}")
    return TOOL_REGISTRY[name]

def get_all_tool_descriptions() -> List[Dict[str, str]]:
    """
    Returns a list of dictionaries containing the name and description of every registered tool.
    This is designed to be injected directly into the ReAct Agent's system prompt.
    """
    return [
        {
            "name": tool.name,
            "description": tool.description
        }
        for tool in TOOL_REGISTRY.values()
    ]

def execute_tool(name: str, **kwargs) -> ToolOutput:
    """
    Looks up a tool by name and executes it with the provided kwargs.
    Returns the standardized ToolOutput object.
    """
    start_time = time.time()
    try:
        tool = get_tool(name)
        return tool.execute(**kwargs)
    except Exception as e:
        execution_time_ms = (time.time() - start_time) * 1000
        return ToolOutput(
            success=False,
            tool_name=name,
            error_message=str(e),
            execution_time_ms=execution_time_ms
        )

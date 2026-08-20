import pytest
import os
from ..registry import get_tool, get_all_tool_descriptions, execute_tool, TOOL_REGISTRY, _initialize_registry
from ..core.schemas import ToolOutput

def test_tool_registry_contents(monkeypatch):
    # Ensure SERPAPI_API_KEY is not set to test the graceful fallback
    monkeypatch.delenv("SERPAPI_API_KEY", raising=False)
    
    # Re-initialize to ensure it picks up the cleared env var
    _initialize_registry()
    
    # Web search should be missing due to the missing API key, but others present
    assert "calculator" in TOOL_REGISTRY
    assert "wikipedia" in TOOL_REGISTRY
    assert "sql_query" in TOOL_REGISTRY
    assert "python_repl" in TOOL_REGISTRY
    assert "web_search" not in TOOL_REGISTRY

def test_get_unknown_tool():
    with pytest.raises(ValueError, match="is not registered"):
        get_tool("nonexistent_tool")

def test_get_all_tool_descriptions():
    descriptions = get_all_tool_descriptions()
    # At least 4 tools should be registered (web_search depends on env variable)
    assert len(descriptions) >= 4
    # Check if they are properly formatted dicts
    for desc in descriptions:
        assert "name" in desc
        assert "description" in desc
        assert len(desc["name"]) > 0
        assert len(desc["description"]) > 0

def test_execute_tool_end_to_end():
    # End-to-end round trip for calculator
    # Tests the complete integration: lookup -> execution -> ToolOutput wrapper
    output = execute_tool("calculator", expression="5 * 5")
    
    assert isinstance(output, ToolOutput)
    assert output.success is True
    assert output.data == 25.0
    assert output.tool_name == "calculator"

def test_execute_tool_unknown_name():
    # Tests that executing an unknown tool returns a valid ToolOutput with success=False
    output = execute_tool("hallucinated_tool_name", some_arg="value")
    
    assert isinstance(output, ToolOutput)
    assert output.success is False
    assert output.tool_name == "hallucinated_tool_name"
    assert "is not registered" in output.error_message
    assert output.execution_time_ms is not None

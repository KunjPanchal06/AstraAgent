import pytest
import os
import requests
from unittest.mock import patch, MagicMock
from ..implementations.web_search_tool import WebSearchTool

@pytest.fixture
def mock_env(monkeypatch):
    monkeypatch.setenv("SERPAPI_API_KEY", "test_mock_key")

@pytest.fixture
def search_tool(mock_env):
    return WebSearchTool(name="web_search", description="Search tool", num_results=2)

def test_missing_api_key(monkeypatch):
    monkeypatch.delenv("SERPAPI_API_KEY", raising=False)
    with pytest.raises(ValueError, match="SERPAPI_API_KEY environment variable is missing"):
        WebSearchTool(name="web_search", description="Search tool")

@patch('requests.get')
def test_valid_search(mock_get, search_tool):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "organic_results": [
            {"title": "Result 1", "link": "https://link1.com", "snippet": "Snippet 1", "extra": "trash"},
            {"title": "Result 2", "link": "https://link2.com", "snippet": "Snippet 2", "extra": "trash"},
            {"title": "Result 3", "link": "https://link3.com", "snippet": "Snippet 3", "extra": "trash"}
        ]
    }
    mock_get.return_value = mock_response
    
    output = search_tool.execute("python programming")
    
    assert output.success is True
    # The fixture set num_results to 2, so it should only return 2 despite 3 being mocked
    assert len(output.data) == 2
    assert output.data[0]["title"] == "Result 1"
    assert "extra" not in output.data[0] # Verify extraneous data is stripped

@patch('requests.get')
def test_auth_failure(mock_get, search_tool):
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_get.return_value = mock_response
    
    output = search_tool.execute("query")
    
    assert output.success is False
    assert "Authentication failed" in output.error_message

@patch('requests.get')
def test_timeout(mock_get, search_tool):
    mock_get.side_effect = requests.exceptions.Timeout("Timeout occurred")
    
    output = search_tool.execute("query")
    
    assert output.success is False
    assert "timed out" in output.error_message

def test_empty_query(search_tool):
    output = search_tool.execute("")
    
    assert output.success is False
    assert "cannot be empty" in output.error_message

@patch('requests.get')
def test_no_organic_results(mock_get, search_tool):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"error": "Google hasn't returned any results"}
    mock_get.return_value = mock_response
    
    output = search_tool.execute("super_obscure_query_123456789")
    
    assert output.success is False
    assert "No organic search results found" in output.error_message

@patch('requests.get')
def test_other_http_error(mock_get, search_tool):
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_get.return_value = mock_response
    
    output = search_tool.execute("query")
    
    assert output.success is False
    assert "HTTP 500" in output.error_message

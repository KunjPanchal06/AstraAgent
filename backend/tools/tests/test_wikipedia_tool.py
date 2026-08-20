import pytest
from unittest.mock import patch, MagicMock
import wikipedia
from ..implementations.wikipedia_tool import WikipediaTool
from ..core.schemas import ToolOutput

@pytest.fixture
def wiki_tool():
    return WikipediaTool(name="wikipedia", description="Wiki tool", sentences=2)

@patch('wikipedia.page')
def test_valid_query(mock_page, wiki_tool):
    # Mock the return value of wikipedia.page()
    mock_page_obj = MagicMock()
    mock_page_obj.title = "Artificial intelligence"
    mock_page_obj.url = "https://en.wikipedia.org/wiki/Artificial_intelligence"
    mock_page_obj.summary = "Artificial intelligence (AI) is the intelligence of machines or software. It is a field of study in computer science that develops and studies intelligent machines. Such machines may be called AIs."
    mock_page.return_value = mock_page_obj
    
    output = wiki_tool.execute("Artificial intelligence")
    
    assert output.success is True
    assert output.data["title"] == "Artificial intelligence"
    assert output.data["url"] == "https://en.wikipedia.org/wiki/Artificial_intelligence"
    # Should be exactly 2 sentences since sentences=2 in the fixture
    assert output.data["summary"] == "Artificial intelligence (AI) is the intelligence of machines or software. It is a field of study in computer science that develops and studies intelligent machines."

@patch('wikipedia.page')
def test_disambiguation_error(mock_page, wiki_tool):
    # Mock a DisambiguationError
    mock_page.side_effect = wikipedia.exceptions.DisambiguationError(
        title="Mercury", 
        may_refer_to=["Mercury (planet)", "Mercury (element)", "Mercury (mythology)"]
    )
    
    output = wiki_tool.execute("Mercury")
    
    assert output.success is False
    assert output.data is None
    assert "Disambiguation error" in output.error_message
    assert "Mercury (planet)" in output.error_message

@patch('wikipedia.page')
def test_page_not_found(mock_page, wiki_tool):
    # Mock a PageError
    mock_page.side_effect = wikipedia.exceptions.PageError(pageid="UnknownQueryXYZ")
    
    output = wiki_tool.execute("UnknownQueryXYZ")
    
    assert output.success is False
    assert output.data is None
    assert "Page not found" in output.error_message

def test_empty_query(wiki_tool):
    output = wiki_tool.execute("")
    
    assert output.success is False
    assert "cannot be empty" in output.error_message
    
    output2 = wiki_tool.execute("   ")
    assert output2.success is False
    assert "cannot be empty" in output2.error_message

@patch('wikipedia.page')
def test_network_timeout(mock_page, wiki_tool):
    # Mock a general exception (like requests.Timeout)
    mock_page.side_effect = Exception("Connection timed out")
    
    output = wiki_tool.execute("ValidQuery")
    
    assert output.success is False
    assert "Wikipedia API error" in output.error_message

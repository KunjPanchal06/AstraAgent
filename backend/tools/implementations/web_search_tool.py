import os
import requests
from pydantic import Field, validator, PrivateAttr
from ..core.schemas import BaseTool, ToolOutput, with_execution_timer

class WebSearchTool(BaseTool):
    """
    A tool to perform web searches using SerpAPI and return concise results.
    """
    name: str = "web_search"
    description: str = "Searches the web for a given query and returns top organic results (title, link, snippet)."
    num_results: int = Field(5, description="Number of search results to return.")
    
    # We use PrivateAttr for the API key so it doesn't get serialized or exposed accidentally
    _api_key: str = PrivateAttr()

    def __init__(self, **data):
        super().__init__(**data)
        api_key = os.environ.get("SERPAPI_API_KEY")
        if not api_key or not str(api_key).strip():
            raise ValueError("SERPAPI_API_KEY environment variable is missing or empty.")
        self._api_key = api_key

    @with_execution_timer
    def execute(self, query: str):
        if not query or not str(query).strip():
            raise ValueError("Search query cannot be empty.")
            
        params = {
            "q": query,
            "api_key": self._api_key,
            "num": self.num_results,
            "engine": "google"
        }
        
        try:
            # Enforce a 10-second timeout
            response = requests.get("https://serpapi.com/search.json", params=params, timeout=10.0)
            
            # Handle specific HTTP error codes explicitly
            if response.status_code in (401, 403):
                raise ValueError("Authentication failed. Invalid or missing SerpAPI API key.")
            elif response.status_code != 200:
                raise ValueError(f"SerpAPI returned an HTTP {response.status_code} error.")
                
            data = response.json()
            
            if "organic_results" not in data or not data["organic_results"]:
                raise ValueError(f"No organic search results found for query: '{query}'.")
                
            # Extract ONLY title, link, and snippet to save context window space
            extracted_results = []
            for item in data["organic_results"][:self.num_results]:
                extracted_results.append({
                    "title": item.get("title", ""),
                    "link": item.get("link", ""),
                    "snippet": item.get("snippet", "")
                })
                
            return extracted_results
            
        except requests.exceptions.Timeout:
            raise ValueError("Search request timed out after 10 seconds. Please try again.")
        except requests.exceptions.RequestException as e:
            # Catch DNS, connection errors, etc.
            raise ValueError(f"Network error during search: {str(e)}")

import re
import wikipedia
from pydantic import Field
from ..core.schemas import BaseTool, ToolOutput, with_execution_timer

class WikipediaTool(BaseTool):
    """
    A tool for retrieving summaries and information from Wikipedia.
    """
    name: str = "wikipedia"
    description: str = "Retrieves a concise summary, title, and URL from Wikipedia for a given search query."
    sentences: int = Field(3, description="Number of sentences to return in the summary.")

    @with_execution_timer
    def execute(self, query: str):
        if not query or not str(query).strip():
            raise ValueError("Wikipedia query cannot be empty.")
        
        try:
            # Fetch the page. auto_suggest=False ensures we get exact matches or precise errors.
            page = wikipedia.page(query, auto_suggest=False)
            
            # The page.summary gives the full intro section. 
            # We truncate it to the requested number of sentences for conciseness.
            # A simple regex split by punctuation + space.
            sentences = re.split(r'(?<=[.!?]) +', page.summary)
            concise_summary = " ".join(sentences[:self.sentences])
            
            return {
                "title": page.title,
                "url": page.url,
                "summary": concise_summary
            }
        except wikipedia.exceptions.DisambiguationError as e:
            # e.options contains the possible matches
            options = ", ".join(e.options[:10]) # Limit to 10 options so we don't overflow context
            raise ValueError(f"Disambiguation error: '{query}' may refer to multiple pages: {options}. Please try a more specific query.")
        except wikipedia.exceptions.PageError:
            raise ValueError(f"Page not found for query: '{query}'.")
        except Exception as e:
            # Catch potential network errors (requests.exceptions.RequestException), etc.
            raise ValueError(f"Wikipedia API error: {str(e)}")

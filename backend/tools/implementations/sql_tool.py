import sqlite3
from typing import Optional, Union, List, Dict, Any
from pydantic import Field
from ..core.schemas import BaseTool, ToolOutput, with_execution_timer

class SQLQueryTool(BaseTool):
    """
    A tool to safely query a local SQLite database.
    """
    name: str = "sql_query"
    description: str = "Executes a SELECT query on the SQLite database and returns up to 100 rows. Use parameters to prevent SQL injection."
    db_path: str = Field(..., description="Path to the SQLite database file or ':memory:'.")
    max_rows: int = Field(100, description="Maximum number of rows to return to avoid overwhelming the LLM context.")

    @with_execution_timer
    def execute(self, query: str, parameters: Optional[Union[List, Dict]] = None) -> List[Dict[str, Any]]:
        """
        Executes a SQL query securely.
        
        :param query: The SQL query string.
        :param parameters: Optional parameters for parameterized queries (list/tuple or dict).
        """
        if not query or not str(query).strip():
            raise ValueError("SQL query cannot be empty.")
            
        # 1. Enforce SELECT queries only (rudimentary but effective whitelist check)
        clean_query = query.strip().upper()
        # We allow WITH for CTEs (Common Table Expressions) and SELECT
        if not (clean_query.startswith("SELECT") or clean_query.startswith("WITH")):
             raise ValueError("Only SELECT queries are allowed. Data modification (INSERT, UPDATE, DELETE, DROP, etc.) is strictly prohibited.")
        
        # 2. Block chained queries by forbidding semicolons anywhere before the absolute end of the string
        if ";" in query.strip()[:-1]:
             raise ValueError("Multiple chained statements are not allowed. Provide a single SELECT query.")
             
        try:
            with sqlite3.connect(self.db_path, uri=True) as conn:
                # Setting row_factory to sqlite3.Row allows accessing columns by name
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # 3. Use parameterized queries if provided
                if parameters:
                    cursor.execute(query, parameters)
                else:
                    cursor.execute(query)
                
                # 4. Enforce row limit via fetchmany instead of fetchall
                rows = cursor.fetchmany(self.max_rows)
                
                # Convert sqlite3.Row objects to standard Python dicts for the ToolOutput
                return [dict(row) for row in rows]
                
        except sqlite3.Error as e:
            raise ValueError(f"SQLite error: {e}")

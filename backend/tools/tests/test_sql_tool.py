import pytest
import sqlite3
from ..implementations.sql_tool import SQLQueryTool

@pytest.fixture
def shared_memory_db():
    # Use a shared in-memory database URI so multiple connections access the same data in tests
    db_uri = "file:testdb?mode=memory&cache=shared"
    
    # Seed the database
    with sqlite3.connect(db_uri, uri=True) as conn:
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)")
        
        # Insert 150 rows to test the row limit (max 100)
        data = [(f"User {i}", 20 + (i % 30)) for i in range(150)]
        cursor.executemany("INSERT INTO users (name, age) VALUES (?, ?)", data)
        conn.commit()
        
    yield db_uri
    
    # Clean up by dropping table
    with sqlite3.connect(db_uri, uri=True) as conn:
        conn.cursor().execute("DROP TABLE IF EXISTS users")

@pytest.fixture
def sql_tool(shared_memory_db):
    return SQLQueryTool(
        name="sql_query", 
        description="SQL tool", 
        db_path=shared_memory_db, 
        max_rows=100
    )

def test_valid_select_query(sql_tool):
    output = sql_tool.execute("SELECT * FROM users WHERE age = 20")
    assert output.success is True
    assert isinstance(output.data, list)
    assert len(output.data) > 0
    assert output.data[0]["age"] == 20

def test_parameterized_query(sql_tool):
    output = sql_tool.execute("SELECT * FROM users WHERE name = ?", parameters=["User 10"])
    assert output.success is True
    assert len(output.data) == 1
    assert output.data[0]["name"] == "User 10"

def test_rejected_drop_query(sql_tool):
    output = sql_tool.execute("DROP TABLE users")
    assert output.success is False
    assert "Only SELECT queries are allowed" in output.error_message

def test_rejected_delete_query(sql_tool):
    output = sql_tool.execute("DELETE FROM users")
    assert output.success is False
    assert "Only SELECT queries are allowed" in output.error_message

def test_rejected_chained_queries(sql_tool):
    output = sql_tool.execute("SELECT * FROM users; DROP TABLE users;")
    assert output.success is False
    assert "Multiple chained statements are not allowed" in output.error_message

def test_invalid_sql_syntax(sql_tool):
    output = sql_tool.execute("SELECT * FROMM users")
    assert output.success is False
    assert "SQLite error" in output.error_message

def test_nonexistent_table(sql_tool):
    output = sql_tool.execute("SELECT * FROM non_existent_table")
    assert output.success is False
    assert "no such table: non_existent_table" in output.error_message

def test_row_limit_enforced(sql_tool):
    output = sql_tool.execute("SELECT * FROM users")
    assert output.success is True
    assert len(output.data) == 100  # The max_rows limit is 100, though 150 rows exist

def test_empty_query(sql_tool):
    output = sql_tool.execute("")
    assert output.success is False
    assert "SQL query cannot be empty" in output.error_message

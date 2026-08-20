import pytest
from ..implementations.repl_tool import PythonREPLTool

@pytest.fixture
def repl_tool():
    # Use a short timeout and short max_length for faster testing
    return PythonREPLTool(
        name="python_repl", 
        description="REPL tool", 
        timeout_seconds=1.0, 
        max_output_length=50
    )

def test_valid_code_with_print(repl_tool):
    code = """
for i in range(3):
    print(i)
"""
    output = repl_tool.execute(code)
    assert output.success is True
    assert "0\n1\n2\n" in output.data

def test_exception_inside_code(repl_tool):
    code = """
print(10 / 0)
"""
    output = repl_tool.execute(code)
    assert output.success is False
    assert "Execution error: ZeroDivisionError" in output.error_message

def test_blocked_import(repl_tool):
    code = """
import os
print(os.name)
"""
    output = repl_tool.execute(code)
    assert output.success is False
    assert "Import statements are strictly prohibited" in output.error_message

def test_blocked_from_import(repl_tool):
    code = """
from sys import exit
"""
    output = repl_tool.execute(code)
    assert output.success is False
    assert "Import statements are strictly prohibited" in output.error_message

def test_blocked_builtin_function(repl_tool):
    code = """
f = open('test.txt', 'w')
"""
    # ast catches 'open' call
    output = repl_tool.execute(code)
    assert output.success is False
    assert "Function open() is strictly prohibited" in output.error_message

def test_blocked_builtin_import_call(repl_tool):
    code = """
os = __import__('os')
"""
    output = repl_tool.execute(code)
    assert output.success is False
    assert "Function __import__() is strictly prohibited" in output.error_message

def test_timeout_infinite_loop(repl_tool):
    code = """
while True:
    pass
"""
    output = repl_tool.execute(code)
    assert output.success is False
    assert "Execution timed out" in output.error_message

def test_output_truncation(repl_tool):
    code = """
print("A" * 100)
"""
    output = repl_tool.execute(code)
    assert output.success is True
    # max length in fixture is 50
    assert "...[Output truncated]" in output.data
    assert len(output.data) <= 50 + len("\n...[Output truncated]")

def test_empty_code(repl_tool):
    output = repl_tool.execute("")
    assert output.success is False
    assert "cannot be empty" in output.error_message

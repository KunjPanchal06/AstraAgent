import pytest
from ..implementations.calculator_tool import CalculatorTool
from ..core.schemas import ToolOutput

@pytest.fixture
def calc_tool():
    return CalculatorTool(name="calculator", description="Math evaluation tool")

def test_valid_expressions(calc_tool):
    output = calc_tool.execute("12 * (3 + 4) / 2")
    assert output.success is True
    assert output.data == 42.0
    
    output2 = calc_tool.execute("2 ** 3 + 1")
    assert output2.success is True
    assert output2.data == 9
    
    output3 = calc_tool.execute("-5 + 10")
    assert output3.success is True
    assert output3.data == 5

def test_division_by_zero(calc_tool):
    output = calc_tool.execute("10 / 0")
    assert output.success is False
    assert output.data is None
    assert "Division by zero is not allowed" in output.error_message

def test_invalid_syntax(calc_tool):
    output = calc_tool.execute("10 + * 5")
    assert output.success is False
    assert output.data is None
    assert "Invalid syntax in expression" in output.error_message

def test_disallowed_operations(calc_tool):
    # Attempting to call a function (code injection attempt)
    output = calc_tool.execute("import os; os.system('echo 1')")
    assert output.success is False
    assert output.data is None
    # Will fail at parse level or safe_eval level (SyntaxError or Unsupported syntax)
    assert output.error_message is not None

    output2 = calc_tool.execute("__import__('os').system('ls')")
    assert output2.success is False
    assert "Unsupported syntax" in output2.error_message or "Unsupported operation" in output2.error_message

    output3 = calc_tool.execute("eval('1+1')")
    assert output3.success is False
    assert "Unsupported syntax" in output3.error_message

def test_empty_input(calc_tool):
    output = calc_tool.execute("")
    assert output.success is False
    assert "Expression cannot be empty" in output.error_message

    output2 = calc_tool.execute("   ")
    assert output2.success is False
    assert "Expression cannot be empty" in output2.error_message

def test_execution_time_is_populated(calc_tool):
    output = calc_tool.execute("1 + 1")
    assert output.success is True
    assert output.execution_time_ms is not None
    assert isinstance(output.execution_time_ms, float)
    assert output.execution_time_ms >= 0

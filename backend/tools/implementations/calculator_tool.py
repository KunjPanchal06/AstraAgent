import ast
import operator
from pydantic import Field
from ..core.schemas import BaseTool, ToolOutput, with_execution_timer

# Whitelist of allowed mathematical operators
_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

def safe_eval(node):
    """Recursively evaluate an AST node safely."""
    # ast.Constant is used in Python 3.8+
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError(f"Unsupported constant type: {type(node.value).__name__}")
    # ast.Num is for Python <= 3.7
    elif isinstance(node, getattr(ast, 'Num', type(None))):
        return getattr(node, 'n', None)
    elif isinstance(node, ast.BinOp):
        if type(node.op) not in _OPS:
            raise ValueError(f"Unsupported operation: {type(node.op).__name__}")
        return _OPS[type(node.op)](safe_eval(node.left), safe_eval(node.right))
    elif isinstance(node, ast.UnaryOp):
        if type(node.op) not in _OPS:
            raise ValueError(f"Unsupported operation: {type(node.op).__name__}")
        return _OPS[type(node.op)](safe_eval(node.operand))
    else:
        raise ValueError(f"Unsupported syntax: {type(node).__name__}")

class CalculatorTool(BaseTool):
    """
    A tool to safely evaluate mathematical expressions.
    """
    name: str = "calculator"
    description: str = "Evaluates a mathematical expression (e.g., '12 * (3 + 4) / 2')."

    @with_execution_timer
    def execute(self, expression: str):
        if not expression or not str(expression).strip():
            raise ValueError("Expression cannot be empty.")
        try:
            # Parse the expression into an Abstract Syntax Tree (AST)
            node = ast.parse(expression, mode='eval').body
            # Safely evaluate only whitelisted mathematical nodes
            return safe_eval(node)
        except SyntaxError as e:
            raise ValueError(f"Invalid syntax in expression: {e}")
        except ZeroDivisionError:
            raise ValueError("Division by zero is not allowed.")

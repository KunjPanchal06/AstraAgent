import io
import ast
import contextlib
import concurrent.futures
from pydantic import Field
from ..core.schemas import BaseTool, ToolOutput, with_execution_timer

# A strict whitelist of safe built-in functions and types.
# Extremely dangerous functions like __import__, eval, exec, open, input are excluded.
SAFE_BUILTINS = {
    'print': print, 'range': range, 'len': len, 'str': str, 'int': int, 
    'float': float, 'list': list, 'dict': dict, 'set': set, 'tuple': tuple, 
    'min': min, 'max': max, 'sum': sum, 'sorted': sorted, 'abs': abs, 
    'round': round, 'enumerate': enumerate, 'zip': zip, 'bool': bool,
    'any': any, 'all': all, 'map': map, 'filter': filter, 'Exception': Exception,
    'ValueError': ValueError, 'TypeError': TypeError, 'KeyError': KeyError,
    'IndexError': IndexError, 'ZeroDivisionError': ZeroDivisionError
}

class PythonREPLTool(BaseTool):
    """
    A tool to safely execute arbitrary Python code and capture stdout output.
    """
    name: str = "python_repl"
    description: str = "Executes Python code in a restricted sandbox and returns stdout output."
    timeout_seconds: float = Field(5.0, description="Max execution time in seconds.")
    max_output_length: int = Field(2000, description="Max characters to return from stdout to prevent context flooding.")

    @with_execution_timer
    def execute(self, code: str):
        if not code or not str(code).strip():
            raise ValueError("Python code cannot be empty.")
            
        # 1. Block imports using AST parsing
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    raise ValueError("Import statements are strictly prohibited for security reasons.")
                # Extra layer of protection against __import__ function calls just in case
                if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                    if node.func.id in ['__import__', 'eval', 'exec', 'open']:
                         raise ValueError(f"Function {node.func.id}() is strictly prohibited.")
        except SyntaxError as e:
            raise ValueError(f"SyntaxError in provided code: {e}")
            
        # 2. Set up the restricted execution environment
        restricted_globals = {"__builtins__": SAFE_BUILTINS}
        restricted_locals = {}

        # 3. Define the actual execution function
        def run_code():
            output_capture = io.StringIO()
            try:
                # Redirect stdout to capture print() output
                with contextlib.redirect_stdout(output_capture):
                    exec(code, restricted_globals, restricted_locals)
                return True, output_capture.getvalue()
            except Exception as e:
                # Catch exceptions raised *by the user's code*
                return False, f"{type(e).__name__}: {str(e)}"
            finally:
                output_capture.close()

        # 4. Enforce timeout using ThreadPoolExecutor. 
        # We use threading instead of signal.alarm() because signal.SIGALRM is not supported on Windows.
        # We cannot use 'with' block because it forces shutdown(wait=True) which hangs on infinite loops.
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        future = executor.submit(run_code)
        try:
            success, result = future.result(timeout=self.timeout_seconds)
        except concurrent.futures.TimeoutError:
            executor.shutdown(wait=False, cancel_futures=True)
            raise ValueError(f"Execution timed out after {self.timeout_seconds} seconds.")
        
        executor.shutdown(wait=False)

        # If it's an error from the user code, format it as a clean tool failure
        if not success:
            raise ValueError(f"Execution error: {result}")
            
        # 5. Output truncation
        if len(result) > self.max_output_length:
            result = result[:self.max_output_length] + "\n...[Output truncated]"
            
        return result

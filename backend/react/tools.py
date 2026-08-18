"""
tools.py — Stub tool registry for the ReAct agent.

Provides a TOOL_REGISTRY with a common interface (fn(args: dict) -> str) so
Student A's real tools can be swapped in as drop-in replacements later.
The agent never imports this module directly; it only interacts through
the run_tool() dispatcher and the tool_descriptions() string.
"""

import json

# ---------------------------------------------------------------------------
# Individual tool implementations
# ---------------------------------------------------------------------------


def calculator(args: dict) -> str:
    """
    Evaluate a mathematical expression and return the result as a string.

    TODO (Student A): Replace this with a safe sandboxed evaluator (e.g.
    numexpr or a custom AST-walking parser). Using eval() here is acceptable
    only as a stub for local testing — it must NOT ship to production because
    eval() can execute arbitrary Python code.
    """
    expression = args.get("expression", "")
    try:
        # WARNING: eval() is unsafe — see TODO above.
        result = eval(expression, {"__builtins__": {}}, {})
        return str(result)
    except Exception as e:
        return f"Calculator error: {e}"


def fake_search(args: dict) -> str:
    """
    Stub web-search tool.  Returns a canned response so the ReAct loop can be
    tested end-to-end before Student A's real search tool is wired in.
    """
    query = args.get("query", "")
    return (
        f'[Fake search result for "{query}"] '
        "According to Wikipedia, the answer you're looking for can be found "
        "by consulting a reliable source. (This is a stub — real search "
        "results will appear once Student A's tool is integrated.)"
    )


# ---------------------------------------------------------------------------
# Registry — maps tool names to their callable + human-readable description.
# Student A adds real tools here; the rest of the codebase doesn't change.
# ---------------------------------------------------------------------------

TOOL_REGISTRY: dict[str, dict] = {
    "calculator": {
        "fn": calculator,
        "description": (
            "Evaluates a math expression. "
            'Input: {"expression": "<math expression>"} — '
            "e.g. {\"expression\": \"47 * 8\"}"
        ),
    },
    "fake_search": {
        "fn": fake_search,
        "description": (
            "Searches the web (stub). "
            'Input: {"query": "<search query>"} — '
            "e.g. {\"query\": \"capital of France\"}"
        ),
    },
}


def tool_descriptions() -> str:
    """
    Render all registered tools into a numbered list suitable for injection
    into the LLM system prompt.  The agent calls this once when building the
    prompt, so adding a new tool to TOOL_REGISTRY is all that's needed.
    """
    lines = []
    for i, (name, meta) in enumerate(TOOL_REGISTRY.items(), start=1):
        lines.append(f"{i}. {name} — {meta['description']}")
    return "\n".join(lines)


def run_tool(name: str, args: dict) -> str:
    """
    Dispatch a tool call by name.  Returns the tool's string output, or an
    error message if the tool is unknown or raises an exception.

    This is the ONLY function the agent loop calls — it never touches
    TOOL_REGISTRY directly, keeping the coupling minimal.
    """
    if name not in TOOL_REGISTRY:
        return f"Error: unknown tool '{name}'. Available tools: {list(TOOL_REGISTRY.keys())}"
    try:
        return TOOL_REGISTRY[name]["fn"](args)
    except Exception as e:
        # Catch tool-level exceptions so a single broken tool doesn't crash
        # the whole agent loop.
        return f"Tool '{name}' raised an error: {e}"

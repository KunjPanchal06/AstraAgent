"""
react_agent.py — Core ReAct (Reason + Act) loop engine.

Implements the iterative Thought → Action → Observation cycle described in
Yao et al. (2022).  The LLM is forced, via a strict system prompt, to output
structured text that is parsed with regex into either:
    • {thought, action, action_input}  →  execute a tool, feed observation back
    • {thought, final_answer}          →  return the answer, end the loop

The loop is hard-capped at MAX_STEPS to prevent runaway token spend if the
model never converges on a final answer.

LLM calls go through the OpenAI SDK pointed at Groq's API (fast LPU
inference).  The model name and max-steps cap are module-level constants so
they're easy to tune without diving into implementation code.
"""

import json
import os
import re
import uuid
from typing import Any, Optional

from dotenv import load_dotenv
from openai import OpenAI

# Automatically load environment variables from .env file if present
load_dotenv()


from .tools import run_tool, tool_descriptions
from .trajectory_logger import TrajectoryLogger

# ---------------------------------------------------------------------------
# Tuneable constants — change these without touching the loop logic
# ---------------------------------------------------------------------------

# The Groq-hosted model to use.  Confirmed available as a production model
# on console.groq.com/docs/models (as of Aug 2026).
MODEL: str = "llama-3.3-70b-versatile"

# Safety cap: if the model hasn't produced a Final Answer after this many
# iterations, we stop the loop and return status "max_steps_reached".
# 8 is generous for most single-step tasks; increase for complex multi-hop
# reasoning if needed.
MAX_STEPS: int = 8

# Maximum tokens the model may generate per turn.
MAX_TOKENS: int = 1024


# ---------------------------------------------------------------------------
# System prompt — injected once at the start of every conversation
# ---------------------------------------------------------------------------

def _build_system_prompt() -> str:
    """
    Construct the system prompt that forces the model into ReAct format.

    The prompt is intentionally explicit and repetitive about the output
    format because open models sometimes drift into free-form answers
    unless heavily constrained.
    """
    tools_block = tool_descriptions()
    return f"""\
You are a helpful AI assistant that solves tasks step-by-step using the
ReAct (Reason + Act) framework.

### Available Tools
{tools_block}

### Output Format (STRICT — follow exactly)

For EVERY turn you MUST output EXACTLY ONE of the two formats below.
Do NOT output anything outside these formats.  Do NOT combine them.

**Format A — when you need to use a tool:**
Thought: <your reasoning about what to do next>
Action: <tool name — must be one of the tool names listed above>
Action Input: <valid JSON object with the tool's required arguments>

**Format B — when you have the final answer:**
Thought: <your reasoning for why the task is now complete>
Final Answer: <the final answer to the user's task>

### Rules
1. Always start with a Thought.
2. If you need information or computation, use Format A.
3. After each tool call you will receive an Observation with the tool's
   output.  Use it to decide your next step.
4. When you are confident in the answer, use Format B.
5. Action Input MUST be valid JSON (use double quotes for keys and strings).
6. Do NOT invent tools that are not listed above.
7. Do NOT output multiple Thought/Action blocks in a single response.
"""


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

# These regexes are intentionally lenient with whitespace so minor formatting
# variations (extra spaces, blank lines) from the model don't break parsing.
# re.DOTALL lets "." match newlines, which is important because the Thought
# field can span multiple lines.

_ACTION_RE = re.compile(
    r"Thought:\s*(?P<thought>.+?)\n\s*"
    r"Action:\s*(?P<action>.+?)\n\s*"
    r"Action Input:\s*(?P<action_input>.+)",
    re.DOTALL,
)

_FINAL_RE = re.compile(
    r"Thought:\s*(?P<thought>.+?)\n\s*"
    r"Final Answer:\s*(?P<final_answer>.+)",
    re.DOTALL,
)


def _parse_llm_output(raw: str) -> dict[str, Any]:
    """
    Parse the model's raw text into a structured dict.

    Returns one of:
        {"type": "action",  "thought": ..., "action": ..., "action_input": ...}
        {"type": "final",   "thought": ..., "final_answer": ...}
        {"type": "error",   "raw": ...}   ← model didn't follow the format

    The action_input is JSON-parsed when possible; if the model emits broken
    JSON we fall back to wrapping the raw string in {"raw_input": ...} so the
    loop can still continue (the tool will likely return an error, which gives
    the model a chance to self-correct on the next turn).
    """
    # Try Final Answer first — it's the shorter pattern and we want to
    # prioritise ending the loop when the model is ready.
    m = _FINAL_RE.search(raw)
    if m:
        return {
            "type": "final",
            "thought": m.group("thought").strip(),
            "final_answer": m.group("final_answer").strip(),
        }

    m = _ACTION_RE.search(raw)
    if m:
        thought = m.group("thought").strip()
        action = m.group("action").strip()
        raw_input = m.group("action_input").strip()

        # Attempt to JSON-parse the action input.
        try:
            action_input = json.loads(raw_input)
        except json.JSONDecodeError:
            # Safe fallback: wrap the unparseable string so the tool at least
            # receives *something* and can return a meaningful error.
            action_input = {"raw_input": raw_input}

        return {
            "type": "action",
            "thought": thought,
            "action": action,
            "action_input": action_input,
        }

    # Neither pattern matched — the model deviated from the format.
    return {"type": "error", "raw": raw}


# ---------------------------------------------------------------------------
# ReActAgent class
# ---------------------------------------------------------------------------

class ReActAgent:
    """
    Wraps the Groq-hosted LLM and drives the ReAct loop.

    Usage:
        agent = ReActAgent()
        trajectory = agent.run("What is 47 * 8?")
        print(trajectory["final_answer"])
    """

    def __init__(self) -> None:
        # The OpenAI client pointed at Groq's endpoint.  The API key is read
        # from the environment so it's never committed to source control.
        self.client = OpenAI(
            api_key=os.environ.get("GROQ_API_KEY", ""),
            base_url="https://api.groq.com/openai/v1",
        )
        self.system_prompt = _build_system_prompt()

    def run(self, task: str) -> dict:
        """
        Execute the full ReAct loop for a given task.

        Parameters
        ----------
        task : The user's natural-language task/question.

        Returns
        -------
        dict : The complete trajectory (same shape as TrajectoryLogger.to_dict()).
        """
        run_id = str(uuid.uuid4())
        logger = TrajectoryLogger(run_id=run_id, task=task)

        # Conversation history starts with just the user's task.
        # Each Observation is appended as a "user" message so the model can
        # reason from real tool outputs on the next turn.
        messages: list[dict[str, str]] = [
            {"role": "user", "content": task},
        ]

        for step in range(1, MAX_STEPS + 1):
            # ----- Call the LLM -----
            response = self.client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    *messages,
                ],
                max_tokens=MAX_TOKENS,
            )
            raw_text = response.choices[0].message.content or ""

            # ----- Parse the output -----
            parsed = _parse_llm_output(raw_text)

            if parsed["type"] == "final":
                # The model is confident — log and return.
                logger.log_step(
                    step_number=step,
                    thought=parsed["thought"],
                    action=None,
                    action_input=None,
                    observation=None,
                )
                logger.finalize(
                    final_answer=parsed["final_answer"],
                    status="completed",
                )
                return logger.to_dict()

            if parsed["type"] == "action":
                # Execute the tool and feed the observation back.
                observation = run_tool(parsed["action"], parsed["action_input"])

                logger.log_step(
                    step_number=step,
                    thought=parsed["thought"],
                    action=parsed["action"],
                    action_input=parsed["action_input"],
                    observation=observation,
                )

                # Append the assistant's raw output and the tool observation so
                # the model has full conversational context on the next turn.
                messages.append({"role": "assistant", "content": raw_text})
                messages.append(
                    {"role": "user", "content": f"Observation: {observation}"}
                )
                continue

            # ----- Parsing error — model didn't follow format -----
            # Log it and give the model a nudge to self-correct.
            logger.log_step(
                step_number=step,
                thought=f"[PARSE ERROR] Raw output: {raw_text}",
                action=None,
                action_input=None,
                observation=None,
            )
            messages.append({"role": "assistant", "content": raw_text})
            messages.append(
                {
                    "role": "user",
                    "content": (
                        "Your previous response did not follow the required "
                        "format. Please respond using EXACTLY one of the two "
                        "formats specified in your instructions (Format A for "
                        "tool use, or Format B for a final answer)."
                    ),
                }
            )

        # ----- Max steps exhausted -----
        logger.finalize(final_answer=None, status="max_steps_reached")
        return logger.to_dict()

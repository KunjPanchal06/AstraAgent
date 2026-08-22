"""
trajectory_logger.py — Per-run trajectory logging for the ReAct agent.

Each agent run gets its own TrajectoryLogger instance that records every
Thought → Action → Observation step with an ISO-8601 UTC timestamp.
Trajectories are persisted as individual JSON files under a `trajectories/`
directory so Student D's dashboard can replay them later.

This module is deliberately LLM-agnostic — it knows nothing about models,
prompts, or tools.  It only stores structured step data.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

# All trajectory JSON files live here (created on first write).
TRAJECTORIES_DIR = Path(__file__).parent / "trajectories"


class TrajectoryLogger:
    """
    Records and persists the step-by-step trajectory of a single agent run.

    Attributes
    ----------
    run_id     : str   — Unique identifier for this run.
    task       : str   — The user's original task string.
    started_at : str   — ISO-8601 UTC timestamp when the run began.
    steps      : list  — Ordered list of step dicts.
    final_answer : str | None — Set when the run completes normally.
    status     : str   — "running", "completed", or "max_steps_reached".
    """
                                                                           
    def __init__(self, run_id: str, task: str) -> None:
        self.run_id: str = run_id
        self.task: str = task
        self.started_at: str = datetime.now(timezone.utc).isoformat()
        self.steps: list[dict[str, Any]] = []
        self.final_answer: Optional[str] = None
        self.status: str = "running"

    # ------------------------------------------------------------------
    # Step logging
    # ------------------------------------------------------------------

    def log_step(
        self,
        step_number: int,
        thought: str,
        action: Optional[str],
        action_input: Optional[dict],
        observation: Optional[str],
    ) -> None:
        """
        Append one Thought/Action/Observation cycle (or a Thought/Final Answer)
        and immediately persist to disk so no data is lost on a crash.
        """
        step = {
            "step_number": step_number,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "thought": thought,
            "action": action,
            "action_input": action_input,
            "observation": observation,
        }
        self.steps.append(step)
        self._persist()

    # ------------------------------------------------------------------
    # Finalisation
    # ------------------------------------------------------------------

    def finalize(self, final_answer: Optional[str], status: str) -> None:
        """
        Mark the run as done.

        Parameters
        ----------
        final_answer : The agent's answer, or None if it hit the step cap.
        status       : "completed" or "max_steps_reached".
        """
        self.final_answer = final_answer
        self.status = status
        self.completed_at = datetime.now(timezone.utc).isoformat()
        self._persist()

    # ------------------------------------------------------------------
    # Serialisation helpers
    # ------------------------------------------------------------------

    def to_dict(self) -> dict:
        """Return the full trajectory as a plain dict (JSON-serialisable)."""
        data = {
            "run_id": self.run_id,
            "task": self.task,
            "started_at": self.started_at,
            "steps": self.steps,
            "final_answer": self.final_answer,
            "status": self.status,
        }
        if hasattr(self, "completed_at"):
            data["completed_at"] = self.completed_at
        return data

    def _persist(self) -> None:
        """Write the current state to a JSON file named after the run_id."""
        TRAJECTORIES_DIR.mkdir(parents=True, exist_ok=True)
        filepath = TRAJECTORIES_DIR / f"{self.run_id}.json"
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)

    # ------------------------------------------------------------------
    # Static helpers for the API layer
    # ------------------------------------------------------------------

    @staticmethod
    def load(run_id: str) -> Optional[dict]:
        """
        Load a previously persisted trajectory by run_id.
        Returns None if the file doesn't exist (lets the API return 404).
        """
        filepath = TRAJECTORIES_DIR / f"{run_id}.json"
        if not filepath.exists():
            return None
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def list_runs() -> list[str]:
        """
        Return a list of all persisted run_ids (sorted newest-first by
        filename, which embeds the UUID — good enough for a prototype).
        """
        if not TRAJECTORIES_DIR.exists():
            return []
        return sorted(
            [p.stem for p in TRAJECTORIES_DIR.glob("*.json")],
            reverse=True,
        )

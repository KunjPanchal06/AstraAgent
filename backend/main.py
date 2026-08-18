"""
main.py — FastAPI application exposing the ReAct agent, trajectory store,
          and user authentication endpoints.

Endpoints:
    POST /api/auth/signup         — Register a new user; returns JWT.
    POST /api/auth/login          — Authenticate a user; returns JWT.
    GET  /api/auth/me             — Current user info (requires JWT).
    POST /agent/run               — Run the agent on a task and return the trajectory.
    GET  /trajectory/{run_id}     — Retrieve a specific saved trajectory.
    GET  /trajectory              — List all saved run IDs.
    GET  /health                  — Basic liveness check.

CORS is wide-open for local development so Student D's React frontend can
call the API without proxy gymnastics.

Start with:
    uvicorn main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from react.react_agent import ReActAgent
from react.trajectory_logger import TrajectoryLogger
from auth.auth import router as auth_router
from database.database import init_db

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(application: FastAPI):
    """Startup: create SQLite tables if they don't exist."""
    await init_db()
    yield


app = FastAPI(
    title="AstraAgent — ReAct Loop Backend",
    description="ReAct prompting engine with trajectory logging and auth.",
    version="0.1.0",
    lifespan=lifespan,
)

# Allow all origins during local development.  Student D will tighten this
# when deploying the final system.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Single agent instance — stateless between runs, so sharing is safe.
agent = ReActAgent()

# Register authentication routes
app.include_router(auth_router)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class RunRequest(BaseModel):
    """Body for POST /agent/run."""
    task: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/agent/run")
async def run_agent(body: RunRequest):
    """
    Execute the ReAct loop for the given task.

    Returns the full trajectory dict including all steps, timestamps,
    final answer, and completion status.
    """
    trajectory = agent.run(body.task)
    return trajectory


@app.get("/trajectory/{run_id}")
async def get_trajectory(run_id: str):
    """Retrieve a previously persisted trajectory by its run_id."""
    data = TrajectoryLogger.load(run_id)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Trajectory '{run_id}' not found.")
    return data


@app.get("/trajectory")
async def list_trajectories():
    """Return a list of all persisted run IDs (newest first)."""
    return {"run_ids": TrajectoryLogger.list_runs()}


@app.get("/health")
async def health_check():
    """Simple liveness probe — returns 200 if the server is up."""
    return {"status": "ok"}

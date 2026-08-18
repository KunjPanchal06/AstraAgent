"""
database.py — Async SQLite database layer for user authentication.

Provides:
    init_db()           — Create tables if they don't exist.
    create_user()       — Insert a new user row.
    get_user_by_email() — Look up a user by email address.

Uses aiosqlite for non-blocking database access within FastAPI's
async request handlers.
"""

import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "astra_agent.db")


async def init_db():
    """Create the users table if it doesn't already exist."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT    NOT NULL,
                email       TEXT    NOT NULL UNIQUE,
                password    TEXT    NOT NULL,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        await db.commit()


async def create_user(name: str, email: str, hashed_password: str) -> dict:
    """
    Insert a new user and return their row as a dict.

    Raises sqlite3.IntegrityError if the email already exists.
    """
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (name, email, hashed_password),
        )
        await db.commit()
        user_id = cursor.lastrowid

    return {"id": user_id, "name": name, "email": email}


async def get_user_by_email(email: str) -> dict | None:
    """
    Return the user row matching *email*, or None if not found.
    """
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT id, name, email, password FROM users WHERE email = ?",
            (email,),
        )
        row = await cursor.fetchone()

    if row is None:
        return None

    return {"id": row["id"], "name": row["name"], "email": row["email"], "password": row["password"]}

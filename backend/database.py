import sqlite3
from contextlib import contextmanager

DB_NAME = "chat_history.db"


def init_db() -> None:
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_NAME)
    try:
        yield conn
    finally:
        conn.close()


def save_message(session_id: str, role: str, message: str) -> None:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO chats (session_id, role, message) VALUES (?, ?, ?)",
            (session_id, role, message),
        )
        conn.commit()


def get_session_messages(session_id: str) -> list[dict]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT role, message FROM chats WHERE session_id = ? ORDER BY id ASC",
            (session_id,),
        )
        rows = cursor.fetchall()
        return [{"role": row[0], "message": row[1]} for row in rows]
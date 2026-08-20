import sqlite3
import os

def seed_database(db_path: str = "sample_data.db"):
    """
    Seeds a sample SQLite database with a 'students' and 'courses' table for testing purposes.
    """
    # Ensure any existing file is removed to start fresh
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create tables
    cursor.execute("""
        CREATE TABLE students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            major TEXT,
            gpa REAL
        )
    """)
    
    cursor.execute("""
        CREATE TABLE courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_name TEXT NOT NULL,
            credits INTEGER NOT NULL
        )
    """)

    # Insert sample data
    students_data = [
        ("Alice", "Smith", "Computer Science", 3.8),
        ("Bob", "Johnson", "Mathematics", 3.5),
        ("Charlie", "Brown", "Physics", 3.2),
        ("Diana", "Prince", "Engineering", 3.9),
        ("Evan", "Wright", "Computer Science", 2.9)
    ]
    cursor.executemany(
        "INSERT INTO students (first_name, last_name, major, gpa) VALUES (?, ?, ?, ?)",
        students_data
    )

    courses_data = [
        ("Intro to Programming", 3),
        ("Calculus I", 4),
        ("Classical Mechanics", 4),
        ("Data Structures", 3)
    ]
    cursor.executemany(
        "INSERT INTO courses (course_name, credits) VALUES (?, ?)",
        courses_data
    )

    conn.commit()
    conn.close()
    print(f"Database successfully seeded at {db_path}!")

if __name__ == "__main__":
    seed_database()

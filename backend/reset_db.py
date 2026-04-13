import sqlite3
import os

DB_PATH = "attendance.db"

def reset_db():
    if os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute("DROP TABLE IF EXISTS attendance")
            cur.execute("DROP TABLE IF EXISTS students")
            conn.commit()
            conn.close()
            print("Dropped old tables.")
        except Exception as e:
            print(f"Error dropping tables: {e}")
    
    from database import init_db
    init_db()
    print("Database reset with new schema.")

if __name__ == "__main__":
    reset_db()

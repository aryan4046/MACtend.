from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables from .env (one level up from backend)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# MongoDB Connection (Env for Docker, localhost for direct)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

client = MongoClient(MONGO_URI)
db = client["attendance_system"]

def init_db():
    """Initializes MongoDB collections and indexes."""

    try:
        # Ensure active_session document exists
        if db.active_session.count_documents({"id": 1}) == 0:
            db.active_session.insert_one({
                "id": 1,
                "programme": "",
                "branch": "",
                "semester": "",
                "sections": [],
                "subject": "",
                "is_active": False
            })

        # Create indexes
        db.students.create_index("enrollment_number", unique=True)
        db.students.create_index("email", unique=True)
        db.students.create_index("mac_address", unique=True)

        db.attendance.create_index([("student_id", 1), ("date", 1), ("subject", 1)])
        db.attendance.create_index("date")


        db.faculties.create_index("email", unique=True)
        db.faculty_logs.create_index("timestamp")

        # Master Data Indexes
        db.colleges.create_index("name", unique=True)
        db.programmes.create_index("name", unique=True)
        db.branches.create_index("name", unique=True)
        db.subjects.create_index("name", unique=True)
        db.subjects.create_index("code", unique=True, sparse=True)

        print("[OK] Local MongoDB Connected & Schema Initialized Successfully")

    except Exception as e:
        print(f"[ERROR] Database initialization error: {e}")

if __name__ == "__main__":
    init_db()
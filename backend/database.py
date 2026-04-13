from pymongo import MongoClient
import os

# Local MongoDB Connection (Docker or local service)
MONGO_URI = "mongodb://localhost:27017/"

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

        db.timetable.create_index([
            ("day", 1),
            ("start_time", 1),
            ("end_time", 1)
        ])

        db.faculties.create_index("email", unique=True)
        db.faculty_logs.create_index("timestamp")

        print("✅ Local MongoDB Connected & Schema Initialized Successfully")

    except Exception as e:
        print(f"❌ Database initialization error: {e}")

if __name__ == "__main__":
    init_db()
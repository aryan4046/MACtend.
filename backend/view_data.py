from database import db
from datetime import datetime

def check_system():
    print("--- ACTIVE SESSION ---")
    session = db.active_session.find_one({"id": 1})
    print(session)
    
    print("\n--- REGISTERED STUDENTS ---")
    students = list(db.students.find())
    print(f"Total Students in MongoDB: {len(students)}")
    for s in students:
        print(f"Name: {s.get('name')}, MAC: {s.get('mac_address')}, Class: {s.get('programme')} {s.get('branch')} Sem:{s.get('semester')} Sec:{s.get('section')}")
        print(f"Last Seen: {s.get('last_seen')}")
        print("-" * 20)

    print("\n--- RECENT ATTENDANCE LOGS ---")
    logs = list(db.attendance.find().sort("_id", -1).limit(10))
    for l in logs:
        student = db.students.find_one({"_id": l.get("student_id")})
        print(f"{student.get('name') if student else 'Unknown'} | {l.get('subject')} | {l.get('date')} {l.get('time')}")

if __name__ == "__main__":
    check_system()

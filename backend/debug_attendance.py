from database import db
from datetime import datetime
import json

def debug():
    session = db.active_session.find_one({"id": 1})
    student = db.students.find_one({"name": "Aryan Samani"})
    
    print("--- SESSION ---")
    print(json.dumps(session, default=str, indent=2))
    
    if student:
        print("\n--- STUDENT ---")
        print(json.dumps(student, default=str, indent=2))
        
        today = datetime.now().strftime("%Y-%m-%d")
        attendance = list(db.attendance.find({
            "student_id": student["_id"],
            "date": today
        }))
        print("\n--- ATTENDANCE TODAY ---")
        print(json.dumps(attendance, default=str, indent=2))
    else:
        print("\nStudent 'Aryan Samani' not found.")

if __name__ == '__main__':
    debug()

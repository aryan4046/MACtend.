from database import db

def check_stats():
    print("\n" + "="*40)
    print("   DATABASE SUMMARY REPORT")
    print("="*40)
    
    collections = {
        "Students": db.students,
        "Faculties": db.faculties,
        "Attendance Logs": db.attendance,
        "Timetable Entries": db.timetable,
        "Colleges": db.colleges,
        "Subjects": db.subjects
    }
    
    try:
        for name, coll in collections.items():
            count = coll.count_documents({})
            print(f" -> {name:18}: {count} records")
    except Exception as e:
        print(f"[ERROR] Could not connect to database: {e}")
        
    print("="*40 + "\n")

if __name__ == "__main__":
    check_stats()

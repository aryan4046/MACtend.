from database import db, init_db
from datetime import datetime
from werkzeug.security import generate_password_hash

def seed_master_data():
    print("[INFO] Seeding Master Data...")
    
    # Colleges
    colleges = ["SOCET", "ASOIT"]
    for c in colleges:
        db.colleges.update_one({"name": c}, {"$set": {"name": c}}, upsert=True)
    
    # Programmes
    programmes = ["BTech", "MTech", "MCA", "BCA", "MBA", "Diploma", "BSc", "MSc"]
    for p in programmes:
        db.programmes.update_one({"name": p}, {"$set": {"name": p}}, upsert=True)
        
    # Branches
    branches = ["CSE", "IT", "ECE", "ME", "Civil", "Chemical", "Automobile", "Electrical", "AIML", "DS"]
    for b in branches:
        db.branches.update_one({"name": b}, {"$set": {"name": b}}, upsert=True)
        
    # Subjects
    subjects = [
        {"name": "FSWD"},
        {"name": "AOC"},
        {"name": "IOT"},
        {"name": "AJ"},
        {"name": "FAIML"},
        {"name": "ABDM"}
    ]
    for s in subjects:
        db.subjects.update_one({"name": s["name"]}, {"$set": s}, upsert=True)

    print("[OK] Master Data Seeded.")

def seed_faculty():
    print("[INFO] Seeding Faculty Accounts...")
    admin_faculty = {
        "name": "Admin Teacher",
        "email": "admin@college.edu",
        "password": generate_password_hash("admin123"),
        "created_at": datetime.now()
    }
    db.faculties.update_one(
        {"email": admin_faculty["email"]},
        {"$set": admin_faculty},
        upsert=True
    )
    print("[OK] Faculty Seeded.")

def seed_test_data():
    print("[INFO] Seeding Test Students...")
    test_students = [
        {
            "name": "Aryan Patel",
            "enrollment_number": "210010116001",
            "email": "aryan@example.edu",
            "college": "SOCET",
            "programme": "btech",
            "branch": "cse",
            "semester": "4",
            "section": "A",
            "mac_address": "AA:BB:CC:DD:EE:FF",
            "created_at": datetime.now()
        },
        {
            "name": "Test Student 2",
            "enrollment_number": "210010116002",
            "email": "test2@example.edu",
            "college": "SOCET",
            "programme": "btech",
            "branch": "cse",
            "semester": "4",
            "section": "B",
            "mac_address": "11:22:33:44:55:66",
            "created_at": datetime.now()
        }
    ]
    for s in test_students:
        db.students.update_one(
            {"enrollment_number": s["enrollment_number"]},
            {"$set": s},
            upsert=True
        )
    print("[OK] Test Data Seeded.")

if __name__ == "__main__":
    init_db() # Ensure indexes are created
    seed_master_data()
    seed_faculty()
    seed_test_data()
    print("\n[SUCCESS] Database Initialization & Seeding Complete!")

from database import db
import sys

def reset_database():
    print("========================================")
    print("   DATABASE CLEANUP IN PROGRESS...      ")
    print("========================================")
    
    # 1. Clear Attendance Logs
    att_count = db.attendance.count_documents({})
    db.attendance.delete_many({})
    print(f"[OK] Cleared {att_count} attendance logs.")
    
    # 2. Reset Student Session States
    # We keep the students themselves, but clear their live tracking data
    db.students.update_many({}, {
        "$set": {
            "last_seen": None,
            "connected_since": None,
            "signal_strength": "--"
        }
    })
    print("[OK] Reset all student network timers.")
    
    # 3. Reset Active Session
    db.active_session.update_one({"id": 1}, {"$set": {"is_active": False, "unmatched_macs": []}})
    print("[OK] Deactivated any hanging sessions.")

    print("========================================")
    print("   CLEANUP COMPLETE! SYSTEM IS FRESH.   ")
    print("========================================")

if __name__ == "__main__":
    confirm = input("Are you sure you want to delete all attendance logs? (y/n): ")
    if confirm.lower() == 'y':
        reset_database()
    else:
        print("Cleanup cancelled.")

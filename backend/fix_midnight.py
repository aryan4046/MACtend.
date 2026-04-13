from database import db
from datetime import datetime

def fix_session():
    # Patch the current session with full datetime objects
    start_at = datetime.strptime("2026-02-23 23:54:40", "%Y-%m-%d %H:%M:%S")
    result = db.active_session.update_one(
        {"id": 1},
        {"$set": {
            "start_date": "2026-02-23",
            "start_time": "23:54:40",
            "start_at": start_at
        }}
    )
    if result.modified_count > 0 or result.matched_count > 0:
        print(f"✅ Active session patched with start_at: {start_at}")
    else:
        print("❌ Could not find active session to patch.")

if __name__ == '__main__':
    fix_session()

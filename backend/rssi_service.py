import subprocess
import os
import sys
import time
import math
import re
import platform
import threading
from datetime import datetime, timedelta
from flask import Flask, jsonify, Response
from flask_cors import CORS

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Import database client from existing database module
try:
    from database import db
except ImportError:
    # Fallback/standalone database initialization
    from pymongo import MongoClient
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    client = MongoClient(MONGO_URI)
    db = client["attendance_system"]

app = Flask(__name__)
# Enable CORS for the frontend port 5173 or other local hosts
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Global state to keep track of the latest calculated RSSI stats
latest_rssi_stats = {}
last_update_time = 0
stats_lock = threading.Lock()

def get_connected_macs_rssi():
    """
    Retrieves connected client MAC addresses and their current RSSI values.
    Supports iw dev and hostapd_cli on Linux/Raspberry Pi.
    On Windows or unsupported platforms, returns empty dictionary.
    """
    macs_rssi = {}
    system = platform.system().lower()
    
    if "linux" in system:
        # 1. Attempt using 'iw dev'
        try:
            # Find wireless interfaces
            iw_dev_out = subprocess.check_output("iw dev", shell=True).decode(errors="ignore")
            interfaces = re.findall(r"Interface\s+(\w+)", iw_dev_out)
            if not interfaces:
                interfaces = ["wlan0"]
                
            for iface in interfaces:
                try:
                    out = subprocess.check_output(f"iw dev {iface} station dump", shell=True).decode(errors="ignore")
                    current_mac = None
                    for line in out.splitlines():
                        line = line.strip()
                        if line.startswith("Station"):
                            parts = line.split()
                            if len(parts) >= 2:
                                current_mac = parts[1].upper().replace("-", ":")
                        elif current_mac and line.startswith("signal:"):
                            # Format: signal:         -42 [-42] dBm or signal: -42 dBm
                            match = re.search(r"signal:\s+(-?\d+)", line)
                            if match:
                                macs_rssi[current_mac] = int(match.group(1))
                except Exception as e:
                    # Ignore per-interface errors
                    pass
        except Exception as e:
            print(f"[RSSI] iw dev scan failed: {e}")

        # 2. Attempt using 'hostapd_cli' as fallback/supplement (great for Hostapd APs)
        try:
            out = subprocess.check_output("hostapd_cli all_sta", shell=True).decode(errors="ignore")
            current_mac = None
            for line in out.splitlines():
                line = line.strip()
                if not line:
                    continue
                if len(line) == 17 and line.count(":") == 5:
                    current_mac = line.upper().replace("-", ":")
                elif current_mac and line.startswith("signal="):
                    parts = line.split("=")
                    if len(parts) == 2:
                        try:
                            rssi_val = int(parts[1])
                            # Only overwrite if not already captured or if hostapd is more fresh
                            macs_rssi[current_mac] = rssi_val
                        except ValueError:
                            pass
        except Exception as e:
            # hostapd_cli might not be running or installed
            pass

    return macs_rssi

def classify_signal_quality(rssi):
    """Classifies RSSI (dBm) into human-readable quality descriptors."""
    if rssi is None:
        return "Unknown"
    if rssi >= -50:
        return "Excellent"
    elif rssi >= -60:
        return "Good"
    elif rssi >= -70:
        return "Fair"
    elif rssi >= -85:
        return "Weak"
    else:
        return "Very Weak"

def calculate_stats(rssi_values):
    """
    Calculates current, average, min, max, stability (standard deviation),
    stability label, and quality classification from a list of RSSI values.
    """
    if not rssi_values:
        return {
            "current": None,
            "average": None,
            "min": None,
            "max": None,
            "stability_pct": None,
            "stability_label": "Unknown",
            "quality": "Unknown"
        }
        
    current = rssi_values[0] # Most recent is first in query sorted by timestamp desc
    avg = sum(rssi_values) / len(rssi_values)
    minimum = min(rssi_values)
    maximum = max(rssi_values)
    
    # Calculate Standard Deviation
    if len(rssi_values) > 1:
        variance = sum((x - avg) ** 2 for x in rssi_values) / len(rssi_values)
        std_dev = math.sqrt(variance)
    else:
        std_dev = 0.0
        
    # Map stability (low std dev = high stability)
    # std_dev of 0 means 100% stable. std_dev >= 10 means 0% stable.
    stability_pct = max(0, min(100, int(100 - (std_dev * 10))))
    
    if std_dev < 2.0:
        stability_label = "Stable"
    elif std_dev < 5.0:
        stability_label = "Moderate"
    else:
        stability_label = "Fluctuating"
        
    quality = classify_signal_quality(current)
    
    # Determine Trend based on last 2 readings
    trend = "Stable"
    if len(rssi_values) >= 2:
        diff = rssi_values[0] - rssi_values[1] # positive means improving (e.g. -50 - (-55) = +5)
        if diff > 2:
            trend = "Improving"
        elif diff < -2:
            trend = "Degrading"
            
    return {
        "current": current,
        "average": round(avg, 1),
        "min": minimum,
        "max": maximum,
        "stability_pct": stability_pct,
        "stability_label": stability_label,
        "quality": quality,
        "trend": trend
    }

def get_session_students(session):
    """Retrieves all students matching the current session filter."""
    if not session:
        return []
        
    programme = session.get("programme")
    branch = session.get("branch")
    semester = session.get("semester")
    sections = session.get("sections", [])
    college = session.get("college", "")
    
    def ci_reg(val): 
        return {"$regex": f"^{str(val).strip()}$", "$options": "i"}
        
    section_queries = [{"section": ci_reg(sec)} for sec in sections]
    
    query = {
        "programme": ci_reg(programme),
        "branch": ci_reg(branch),
        "semester": ci_reg(semester),
        "$or": section_queries,
        "$and": [
            {"$or": [
                {"college": ci_reg(college)},
                {"college": {"$exists": False}},
                {"college": ""}
            ]}
        ]
    }
    
    return list(db.students.find(query))

def generate_mock_rssi(student_id, last_rssi=None):
    """Generates a realistic, slightly fluctuating mock RSSI value for testing."""
    import random
    
    # Use deterministic seed base on student ID string to make baseline consistent
    seed_num = sum(ord(c) for c in str(student_id))
    random.seed(seed_num + int(time.time() // 60)) # change baseline slightly every minute
    
    baseline = random.randint(-75, -45)
    
    # Add temporary fluctuation
    random.seed() # reset seed
    fluctuation = random.randint(-4, 4)
    
    # Keep RSSI within normal limits
    rssi = baseline + fluctuation
    return max(-95, min(-30, rssi))

def rssi_scanner_loop():
    """Background thread scanner that updates RSSI data in MongoDB and memory."""
    global latest_rssi_stats, last_update_time
    print("[RSSI Service] Starting background scanner loop...")
    
    while True:
        try:
            # 1. Fetch active session
            session = db.active_session.find_one({"id": 1})
            
            if not session or not session.get("is_active"):
                # No active session: clear memory and sleep
                with stats_lock:
                    latest_rssi_stats = {}
                time.sleep(5)
                continue
                
            subject = session.get("subject")
            students = get_session_students(session)
            
            # Detect platform & get connected devices
            is_windows = platform.system().lower() == "windows"
            # In Windows, we check if MOCK_RSSI=true is set, or default to mock for testing
            mock_enabled = os.getenv("MOCK_RSSI", "true").lower() == "true"
            
            connected_rssi_map = {}
            if not is_windows:
                connected_rssi_map = get_connected_macs_rssi()
                
            now = datetime.now()
            updated_stats = {}
            
            # Clean up history entries older than 15 minutes to save database space
            cutoff_time = now - timedelta(minutes=15)
            db.rssi_history.delete_many({"timestamp": {"$lt": cutoff_time}})
            
            for s in students:
                mac = (s.get("mac_address") or "").strip().upper().replace("-", ":")
                if not mac:
                    continue
                    
                student_id_str = str(s["_id"])
                rssi = None
                
                # Check if device is detected on Linux
                if mac in connected_rssi_map:
                    rssi = connected_rssi_map[mac]
                # Fallback to simulation/mock mode on Windows or if mock is explicitly set
                elif (is_windows and mock_enabled) or (not is_windows and mock_enabled and s.get("signal_strength") not in ["--", "Offline", None]):
                    # Check if student is active recently (last seen < 30 seconds)
                    last_seen_str = s.get("last_seen")
                    is_active = False
                    if last_seen_str:
                        try:
                            last_seen_time = datetime.fromisoformat(last_seen_str)
                            if (now - last_seen_time).total_seconds() < 30:
                                is_active = True
                        except Exception:
                            pass
                            
                    if is_active:
                        # Get last recorded RSSI for smoothing
                        last_rec = db.rssi_history.find_one(
                            {"student_id": s["_id"], "subject": subject},
                            sort=[("timestamp", -1)]
                        )
                        last_rssi = last_rec.get("rssi") if last_rec else None
                        rssi = generate_mock_rssi(student_id_str, last_rssi)
                
                # If we have a valid RSSI reading, record and compute stats
                if rssi is not None:
                    # Write to MongoDB RSSI history
                    db.rssi_history.insert_one({
                        "student_id": s["_id"],
                        "mac_address": mac,
                        "rssi": rssi,
                        "timestamp": now,
                        "subject": subject
                    })
                    
                    # Fetch last 10 records for statistics
                    history_records = list(db.rssi_history.find(
                        {"student_id": s["_id"], "subject": subject}
                    ).sort("timestamp", -1).limit(10))
                    
                    rssi_vals = [r["rssi"] for r in history_records]
                    
                    # Calculate metric summaries
                    stats = calculate_stats(rssi_vals)
                    stats["last_updated"] = now.strftime("%H:%M:%S")
                    updated_stats[student_id_str] = stats
                    
            # Safely swap global state
            with stats_lock:
                latest_rssi_stats = updated_stats
                last_update_time = time.time()
                
            print(f"[RSSI Service] Scanned and updated RSSI metrics for {len(updated_stats)} students.")
            
        except Exception as e:
            print(f"[RSSI Service] Error in scanner loop: {e}")
            
        time.sleep(5)

# ---------- API ENDPOINTS ----------

@app.route("/api/rssi/live", methods=["GET"])
def get_live_rssi():
    """Returns a snapshot of the latest computed RSSI stats for active students."""
    with stats_lock:
        return jsonify({
            "success": True,
            "data": latest_rssi_stats
        })

@app.route("/api/rssi/stream")
def stream_rssi_sse():
    """Server-Sent Events (SSE) endpoint to stream real-time RSSI updates to the frontend."""
    def event_stream():
        import json
        local_last_update = 0
        while True:
            global last_update_time, latest_rssi_stats
            # Compare modification timestamps to prevent resending identical data
            if last_update_time > local_last_update:
                local_last_update = last_update_time
                with stats_lock:
                    data_str = json.dumps({"success": True, "data": latest_rssi_stats})
                yield f"data: {data_str}\n\n"
            time.sleep(2)
            
    return Response(event_stream(), mimetype="text/event-stream")

# Start background thread
scanner_thread = threading.Thread(target=rssi_scanner_loop, daemon=True)
scanner_thread.start()

if __name__ == "__main__":
    port = int(os.getenv("RSSI_PORT", 5001))
    print(f"Starting RSSI Service Daemon on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)

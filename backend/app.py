from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import subprocess
import os
from werkzeug.security import generate_password_hash, check_password_hash
import io
import csv
from datetime import datetime
import base64
import numpy as np
import cv2
from database import db
from werkzeug.middleware.proxy_fix import ProxyFix
import platform
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2' # Suppress TensorFlow INFO messages
# We will import face_recognition inside the routes to allow app to start 
# even if installation is still finishing or has issues
try:
    import face_recognition
except ImportError:
    print("Warning: face_recognition not found. Face login will be disabled until installed.")

app = Flask(__name__)
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=True
)

# ✅ VERY IMPORTANT (Fix real client IP behind Vite proxy)
app.wsgi_app = ProxyFix(
    app.wsgi_app,
    x_for=1,
    x_proto=1,
    x_host=1,
    x_port=1
)



# ---------- HELPER FUNCTIONS ----------
def get_mac(ip):
    """Reliable MAC detection for Windows and Linux"""
    try:
        if not ip:
            return None
            
        if ip in ["127.0.0.1", "localhost", "::1"]:
            return "LOCAL:TEST"
            
        # Strip IPv6 scope ID if present (e.g. fe80::...%6)
        clean_ip = ip.split('%')[0]

        system = platform.system().lower()

        if system == "windows":
            # Quick ping to ensure ARP cache is populated
            subprocess.call(f"ping -n 1 -w 1000 {clean_ip} > NUL 2>&1", shell=True)
            
            # Try arp lookup with improved parsing
            output = subprocess.check_output("arp -a", shell=True).decode(errors="ignore")
            
            # Strategy: Look for the exact IP or variations
            # Some Windows versions pad IPs with spaces or leading zeros
            for line in output.split("\n"):
                if clean_ip.lower() in line.lower():
                    parts = line.split()
                    # Find the part that looks like a MAC address (XX-XX-XX-XX-XX-XX)
                    for part in parts:
                        mac_candidate = part.replace("-", ":").upper()
                        if len(mac_candidate) == 17 and mac_candidate.count(":") == 5:
                            return mac_candidate

            # Fallback for IPv6 neighbors
            if ":" in clean_ip:
                output_v6 = subprocess.check_output("netsh interface ipv6 show neighbors", shell=True).decode(errors="ignore")
                for line in output_v6.split("\n"):
                    if clean_ip.lower() in line.lower():
                        parts = line.split()
                        for p in parts:
                            mac_v6 = p.replace("-", ":").upper()
                            if len(mac_v6) == 17 and mac_v6.count(":") == 5:
                                return mac_v6
        else:
            # Force ARP refresh (important)
            subprocess.call(f"ping -c 1 -W 1 {ip} > /dev/null 2>&1", shell=True)

            output = subprocess.check_output("ip neigh show", shell=True).decode(errors="ignore")

            for line in output.split("\n"):
                if ip in line and "lladdr" in line:
                    parts = line.split()
                    if parts[0] == ip:
                        mac_index = parts.index("lladdr") + 1
                        return parts[mac_index].upper()

    except Exception as e:
        print(f"MAC detection error for IP {ip}:", e)

    # Return a fallback format instead of None so we know it reached this point but failed to find MAC
    return f"UNKNOWN_MAC_FOR_{ip}"
def get_client_ip():
    """
    Get REAL client IP even behind various proxies
    """
    # Try common proxy headers first
    ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or \
         request.headers.get("X-Real-IP", "").strip() or \
         request.remote_addr

    # Clean IPv4-mapped IPv6 addresses
    if ip and ip.startswith("::ffff:"):
        ip = ip.replace("::ffff:", "")
        
    return ip
# ---------- FACULTY ROUTES ----------

@app.route("/api/faculty/register", methods=["POST"])
def register_faculty():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not all([name, email, password]):
        return jsonify({"success": False, "error": "Missing required fields"}), 400

    try:
        db.faculties.insert_one({
            "name": name,
            "email": email,
            "password": generate_password_hash(password),  # 🔐 hashed
            "created_at": datetime.now()
        })
        return jsonify({"success": True, "message": "Teacher registered successfully"})
    except Exception as e:
        if "duplicate key error" in str(e).lower():
            return jsonify({"success": False, "error": "Email already registered"}), 409
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/faculty/login", methods=["POST"])
def faculty_login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not all([email, password]):
        return jsonify({"success": False, "error": "Missing required fields"}), 400

    faculty = db.faculties.find_one({"email": email})

    # 🔐 Secure password verification
    if not faculty or not check_password_hash(faculty["password"], password):
        db.faculty_logs.insert_one({
            "email": email,
            "status": "failed_credentials",
            "timestamp": datetime.now()
        })
        return jsonify({"success": False, "error": "Invalid Email or Password"}), 401

    db.faculty_logs.insert_one({
        "email": email,
        "name": faculty["name"],
        "status": "success",
        "timestamp": datetime.now()
    })
    return jsonify({
        "success": True,
        "message": f"Welcome, {faculty['name']}",
        "token": "teacher-session-token",
        "faculty": {
            "name": faculty["name"],
            "email": faculty["email"]
        }
    })

# ---------- API ROUTES ----------

@app.route("/api/detect-mac", methods=["GET"])
def detect_mac():

    ip = get_client_ip()
    mac = get_mac(ip)

    print(f"[MAC DETECT] REAL_IP={ip} MAC={mac}")

    if mac and not mac.startswith("UNKNOWN_"):
        return jsonify({
            "success": True,
            "ip": ip,
            "mac_address": mac
        })

    return jsonify({
        "success": False,
        "error": "MAC not detected"
    }), 404

@app.route("/api/register", methods=["POST"])
def register():

    data = request.json
    if not data:
        return jsonify({
            "success": False,
            "error": "No data provided"
        }), 400

    # ---------- STUDENT DATA ----------
    name = data.get("name")
    enrollment_number = data.get("enrollment_number")
    email = data.get("email")
    college = data.get("college")
    programme = data.get("programme", "").lower().strip()
    career_path = data.get("career_path", "").lower().strip()
    branch = data.get("branch", "").lower().strip()
    semester = str(data.get("semester", "")).strip()
    section = data.get("section", "").upper().strip()

    # ---------- REAL CLIENT IP ----------
    ip = get_client_ip()

    # ---------- MAC DETECTION ----------
    mac = get_mac(ip)

    print(f"[REGISTER] NAME={name} | REAL_IP={ip} | MAC={mac}")

    # Prevent localhost registration
    if not mac or mac == "LOCAL:TEST" or mac.startswith("UNKNOWN_"):
        return jsonify({
            "success": False,
            "error": "MAC address not detected. Connect to Raspberry Pi WiFi."
        }), 400

    # ---------- DATABASE INSERT ----------
    try:
        db.students.insert_one({
            "name": name,
            "enrollment_number": enrollment_number,
            "email": email,
            "college": college,
            "mac_address": mac,
            "programme": programme,
            "career_path": career_path,
            "branch": branch,
            "semester": semester,
            "section": section,
            "registered_ip": ip,
            "created_at": datetime.now(),
            "last_seen": None
        })

        return jsonify({
            "success": True,
            "message": "Registered successfully",
            "mac": mac
        })

    except Exception as e:
        if "duplicate key error" in str(e).lower():
            return jsonify({
                "success": False,
                "error": "Student or device already registered"
            }), 409

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/api/attendance", methods=["GET"])
def get_attendance():
    # 1. Get active session to filter logs
    session = db.active_session.find_one({"id": 1})
    
    if not session:
        return jsonify({"success": False, "error": "No session found"})

    def ci_reg(val): return {"$regex": f"^{str(val).strip()}$", "$options": "i"}
    
    is_active = bool(session.get("is_active"))
    prog = session.get("programme")
    college = session.get("college")
    branch = session.get("branch")
    sem = session.get("semester")
    sections = session.get("sections", [])
    subj = session.get("subject")
    start_at = session.get("start_at")
    
    if not prog or not subj or not start_at:
         return jsonify({"success": True, "logs": [], "is_active": is_active})

    # Prepare common section query
    section_queries = [{"section": ci_reg(sec)} for sec in sections]
    
    # Common Filter for both Active/Inactive views
    filter_query = {
        "programme": ci_reg(prog),
        "branch": ci_reg(branch),
        "semester": ci_reg(sem),
        "$or": section_queries,
        "$and": [
            {"$or": [
                {"college": ci_reg(college)},
                {"college": {"$exists": False}},
                {"college": ""}
            ]}
        ]
    }

    students = list(db.students.find(filter_query))
    
    now = datetime.now()
    logs = []
    for s in students:
        is_online = False
        last_seen_str = s.get("last_seen")
        if last_seen_str:
            try:
                last_seen_time = datetime.fromisoformat(last_seen_str)
                if (now - last_seen_time).total_seconds() < 30:
                    is_online = True
            except: pass
        
        # Find latest log entry for this student/subject AFTER session started
        log_entries = list(db.attendance.find({
            "student_id": s["_id"],
            "subject": subj,
            "date": {"$gte": start_at.strftime("%Y-%m-%d")}
        }))
        
        log_entry = None
        for entry in log_entries:
            try:
                e_dt = datetime.strptime(f"{entry['date']} {entry['time']}", "%Y-%m-%d %H:%M:%S")
                if e_dt >= start_at:
                    if not log_entry:
                        log_entry = entry
                    else:
                        le_dt = datetime.strptime(f"{log_entry['date']} {log_entry['time']}", "%Y-%m-%d %H:%M:%S")
                        if e_dt > le_dt:
                            log_entry = entry
            except: continue
        
        logs.append({
            "studentId": str(s["_id"]),
            "name": s.get("name"),
            "enrollmentNumber": s.get("enrollment_number"),
            "subject": subj,
            "time": log_entry.get("time") if log_entry else "--:--",
            "is_online": is_online,
            "source": log_entry.get("source", "auto") if log_entry else "--",
            "signal_strength": s.get("signal_strength") if is_online else None
        })
    
    return jsonify({
        "success": True, 
        "logs": logs, 
        "is_active": is_active,
        "session": {
            "programme": prog,
            "branch": branch,
            "semester": sem,
            "sections": sections,
            "subject": subj
        } if session else None
    })

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    if (email == "admin@college.edu" and password == "admin123") or (email == "admin@edu.in" and password == "admin123"):
        return jsonify({"success": True, "token": "mock-jwt-token"})
    return jsonify({"success": False, "error": "Invalid credentials"}), 401
@app.route("/api/session/start", methods=["POST"])
def start_session():
    data = request.json
    
    # Very important: When starting a new session, clear all old connection metrics
    # Otherwise, students from yesterday will instantly have duration > 5 mins if they immediately connect today
    db.students.update_many(
        {},
        {"$set": {"connected_since": None, "last_seen": None}}
    )

    db.active_session.update_one(
        {"id": 1},
        {
            "$set": {
                "id": 1,
                "programme": data.get("programme"),
                "college": data.get("college"),
                "branch": data.get("branch"),
                "semester": data.get("semester"),
                "sections": data.get("sections"),
                "subject": data.get("subject"),
                "start_at": datetime.now(),
                "is_active": True
            }
        },
        upsert=True
    )

    return jsonify({"success": True})
@app.route("/api/session/stats", methods=["GET"])
def session_stats():
    session = db.active_session.find_one({"id": 1})

    if not session or not session.get("is_active"):
        return jsonify({"success": False, "error": "No active session"})

    prog = session.get("programme")
    college = session.get("college")
    branch = session.get("branch")
    sem = session.get("semester")
    sections = session.get("sections", [])
    subj = session.get("subject")

    def ci_reg(val): return {"$regex": f"^{str(val).strip()}$", "$options": "i"}
    section_queries = [{"section": ci_reg(sec)} for sec in sections]

    filter_query = {
        "programme": ci_reg(prog),
        "branch": ci_reg(branch),
        "semester": ci_reg(sem),
        "$or": section_queries,
        "$and": [
            {"$or": [
                {"college": ci_reg(college)},
                {"college": {"$exists": False}},
                {"college": ""}
            ]}
        ]
    }

    students = list(db.students.find(filter_query))

    total = len(students)
    present = 0
    live = 0

    now = datetime.now()
    today = now.strftime("%Y-%m-%d")

    start_at = session.get("start_at")

    if not start_at:
        start_date_str = session.get("start_date", today)
        start_time_str = session.get("start_time", "00:00:00")
        start_at = datetime.strptime(
            f"{start_date_str} {start_time_str}",
            "%Y-%m-%d %H:%M:%S"
        )

    for s in students:

        # -----------------------------
        # ✅ DYNAMIC LIVE WIFI CHECK
        # -----------------------------
        last_seen_str = s.get("last_seen")

        if last_seen_str:
            try:
                last_seen_time = datetime.fromisoformat(last_seen_str)

                # Reduced threshold to 15 sec for faster drop
                if (now - last_seen_time).total_seconds() < 15:
                    live += 1

            except Exception:
                pass

        # -----------------------------
        # ✅ STRICT ATTENDANCE CHECK
        # -----------------------------
        log_entries = list(db.attendance.find({
            "student_id": s["_id"],
            "subject": subj,
            "date": {"$gte": start_at.strftime("%Y-%m-%d")}
        }))

        for entry in log_entries:
            try:
                entry_dt = datetime.strptime(
                    f"{entry['date']} {entry['time']}",
                    "%Y-%m-%d %H:%M:%S"
                )

                if entry_dt >= start_at:
                    present += 1
                    break  # Only count the student once!

            except Exception:
                pass

    absent = max(0, total - present)

    return jsonify({
        "success": True,
        "total": total,
        "present": present,
        "absent": absent,
        "live": live
    })
@app.route("/api/session/stop", methods=["POST"])
def stop_session():
    db.active_session.update_one({"id": 1}, {"$set": {"is_active": False}})
    return jsonify({"success": True, "message": "Session stopped"})

@app.route("/api/session/status", methods=["GET"])
def session_status():
    session = db.active_session.find_one({"id": 1})
    if not session:
        return jsonify({"is_active": False})
    
    is_active = bool(session.get("is_active"))
    start_at = session.get("start_at")
    remaining_seconds = 0
    
    if is_active and start_at:
        # Calculate time elapsed
        elapsed = (datetime.now() - start_at).total_seconds()
        remaining_seconds = max(0, 300 - int(elapsed)) # 300s = 5 mins
        
        # Auto-expire if time is up
        if remaining_seconds <= 0:
            db.active_session.update_one({"id": 1}, {"$set": {"is_active": False}})
            is_active = False
            
    return jsonify({
        "college": session.get("college"),
        "programme": session.get("programme"),
        "branch": session.get("branch"),
        "semester": session.get("semester"),
        "sections": session.get("sections", []),
        "subject": session.get("subject"),
        "is_active": is_active,
        "remaining_seconds": remaining_seconds
    })



@app.route("/api/export/excel", methods=["GET"])
def export_excel():
    import pandas as pd
    
    # Get the latest session parameters
    session = db.active_session.find_one({"id": 1})
    if not session:
        return jsonify({"success": False, "error": "No session history found"}), 404
        
    programme = session.get("programme")
    college = session.get("college")
    branch = session.get("branch")
    semester = session.get("semester")
    sections = session.get("sections", [])
    subject = session.get("subject")
    
    # 🔍 DYNAMIC DATE DETECTION
    # Instead of forcing 'today', find the latest date attendance was recorded for this subject
    latest_log = db.attendance.find_one({"subject": subject}, sort=[("date", -1)])
    report_date = latest_log.get("date") if latest_log else datetime.now().strftime("%Y-%m-%d")

    # 1. Fetch ALL students that SHOULD be in this session
    def ci_reg(val): return {"$regex": f"^{str(val).strip()}$", "$options": "i"}
    section_queries = [{"section": ci_reg(sec)} for sec in sections]
    
    student_query = {
        "programme": ci_reg(programme),
        "college": ci_reg(college),
        "branch": ci_reg(branch),
        "semester": ci_reg(semester),
        "$or": section_queries
    }
    all_students = list(db.students.find(student_query))
    
    # 2. Fetch all logs for this specific subject and determined date
    logs = list(db.attendance.find({
        "subject": subject,
        "date": report_date
    }))
    present_ids = {str(l["student_id"]) for l in logs}

    present_data = []
    absent_data = []

    for s in all_students:
        s_id = str(s["_id"])
        row = {
            "Student Name": s.get("name"),
            "Enrollment Number": str(s.get("enrollment_number")),
            "College": s.get("college"),
            "Programme": s.get("programme"),
            "Branch": s.get("branch"),
            "Section": s.get("section"),
            "Date": report_date,
            "Status": "PRESENT" if s_id in present_ids else "ABSENT"
        }
        
        if s_id in present_ids:
            log = next((l for l in logs if str(l["student_id"]) == s_id), {})
            row["Time Seen"] = log.get("time", "--:--")
            row["Method"] = log.get("source", "iot")
            present_data.append(row)
        else:
            absent_data.append(row)

    # 3. Create Excel with two sheets
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df_present = pd.DataFrame(present_data)
        df_absent = pd.DataFrame(absent_data)
        
        if not df_present.empty:
            df_present.sort_values(by="Student Name", inplace=True)
            df_present.to_excel(writer, sheet_name='Present Students', index=False)
            
        if not df_absent.empty:
            df_absent.sort_values(by="Student Name", inplace=True)
            df_absent.to_excel(writer, sheet_name='Absent Students', index=False)
        
        if df_present.empty and df_absent.empty:
            # Fallback: Just show all history if no filtering matches
            all_logs = list(db.attendance.find({"subject": subject}).sort("date", -1))
            if all_logs:
                history = []
                for l in all_logs:
                    st = db.students.find_one({"_id": l["student_id"]})
                    history.append({
                        "Name": st.get("name") if st else "Unknown",
                        "Enrollment": str(st.get("enrollment_number")) if st else "N/A",
                        "Date": l.get("date"),
                        "Time": l.get("time")
                    })
                pd.DataFrame(history).to_excel(writer, sheet_name='Full Attendance History', index=False)
            else:
                pd.DataFrame([{"Message": "No students or logs found for this session."}]).to_excel(writer, sheet_name='Empty Report')

    output.seek(0)
    
    file_name = f"Attendance_{subject}_{report_date}.xlsx"
    response = Response(
        output.read(),
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response.headers["Content-Disposition"] = f"attachment; filename={file_name}"
    return response

@app.route("/api/export/csv", methods=["GET"])
def export_csv():
    # Maintain CSV as a legacy single-list backup
    cursor = db.attendance.find().sort("date", -1).sort("time", -1)

@app.route("/api/sections", methods=["GET"])
def get_sections():
    programme = request.args.get("programme", "").lower().strip()
    college = request.args.get("college", "").strip()
    branch = request.args.get("branch", "").lower().strip()
    semester = str(request.args.get("semester", "")).strip()
    
    if not programme or not college or not branch or not semester:
        return jsonify({"success": False, "error": "Missing parameters"}), 400
        
    query = {
        "programme": programme,
        "college": college,
        "branch": branch,
        "semester": semester
    }

    sections = db.students.distinct("section", query)
    
    return jsonify({"success": True, "sections": sorted(sections)})

@app.route("/api/attendance/toggle", methods=["POST"])
def toggle_attendance():
    from bson import ObjectId
    data = request.json
    student_id = data.get("studentId")
    subject = data.get("subject")
    present = data.get("present")
    source = data.get("source", "manual")
    
    if not student_id or not subject:
        return jsonify({"success": False, "error": "Missing studentId or subject"}), 400
        
    today = datetime.now().strftime("%Y-%m-%d")
    
    try:
        obj_id = ObjectId(student_id)
        if present:
            now_time = datetime.now().strftime("%H:%M:%S")
            db.attendance.update_one(
                {"student_id": obj_id, "subject": subject, "date": today},
                {"$set": {"time": now_time, "source": source}},
                upsert=True
            )
            return jsonify({"success": True, "time": now_time, "source": source})
        else:
            db.attendance.delete_one({"student_id": obj_id, "subject": subject, "date": today})
            return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/status", methods=["GET"])
def status():
    return jsonify({"status": "online", "network": "local", "db": "mongodb"})

if __name__ == "__main__":
    print("[INFO] Resetting active session on startup...")

    db.active_session.update_one(
        {"id": 1},
        {"$set": {"is_active": False}}
    )

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True,
        use_reloader=False
    )
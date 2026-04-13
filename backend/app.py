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
            # Quick ping to ensure ARP cache is populated without waiting too long
            subprocess.call(f"ping -n 1 -w 500 {clean_ip} > NUL 2>&1", shell=True)
            
            # Check if it's an IPv6 address
            if ":" in clean_ip:
                output = subprocess.check_output("netsh interface ipv6 show neighbors", shell=True).decode(errors="ignore")
            else:
                output = subprocess.check_output("arp -a", shell=True).decode(errors="ignore")
            
            for line in output.split("\n"):
                if "---" not in line and clean_ip.lower() in line.lower():
                    parts = line.split()
                    if len(parts) >= 2 and parts[0].lower() == clean_ip.lower():
                        # Sometimes IPv6 netsh leaves empty physical address for some entries, check it looks like a mac
                        mac_candidate = parts[1].replace("-", ":").upper()
                        if ":" in mac_candidate and len(mac_candidate) >= 11:
                            return mac_candidate
                        if mac_candidate != "UNREACHABLE":
                            return mac_candidate
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
    Get REAL client IP even behind Vite proxy
    """
    forwarded = request.headers.get("X-Forwarded-For")

    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.remote_addr

    # Clean IPv4-mapped IPv6 addresses just in case
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
            "mac": mac
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
    enrollment_number = data.get("enrollmentNumber")
    email = data.get("email")
    programme = data.get("programme", "").lower().strip()
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
            "mac_address": mac,
            "programme": programme,
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
    
    logs = []
    if session and session.get("is_active"):
        prog = session.get("programme")
        sem = session.get("semester")
        branch = session.get("branch")
        sections = session.get("sections", [])
        subj = session.get("subject")
        
        # Get all students for these sections
        students = list(db.students.find({
            "programme": prog,
            "branch": branch,
            "semester": sem,
            "section": {"$in": sections}
        }))
        
        now = datetime.now()
        today_date_str = now.strftime("%Y-%m-%d")
        start_at = session.get("start_at")
        # For backward compatibility if start_at missing
        if not start_at:
            start_date_str = session.get("start_date", today_date_str)
            start_time_str = session.get("start_time", "00:00:00")
            start_at = datetime.strptime(f"{start_date_str} {start_time_str}", "%Y-%m-%d %H:%M:%S")

        for s in students:
            is_online = False
            last_seen_str = s.get("last_seen")
            if last_seen_str:
                try:
                    last_seen_time = datetime.fromisoformat(last_seen_str)
                    if (now - last_seen_time).total_seconds() < 30:
                        is_online = True
                except: pass
            
            # Find log entry for this student/subject AFTER session started
            # We filter by date/time >= start_at
            # More robust: use a single timestamp field in attendance, but for now we filter by date/time
            log_entries = list(db.attendance.find({
                "student_id": s["_id"],
                "subject": subj,
                "date": {"$gte": start_at.strftime("%Y-%m-%d")}
            }))
            
            # Filter manually for strict time comparison if on the same start date
            log_entry = None
            for entry in log_entries:
                entry_dt = datetime.strptime(f"{entry['date']} {entry['time']}", "%Y-%m-%d %H:%M:%S")
                if entry_dt >= start_at:
                    if not log_entry or entry_dt > datetime.strptime(f"{log_entry['date']} {log_entry['time']}", "%Y-%m-%d %H:%M:%S"):
                        log_entry = entry

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
    else:
        # Session is inactive. Show the logs for the LAST session that was and still is in document 1.
        prog = session.get("programme")
        sem = session.get("semester")
        branch = session.get("branch")
        sections = session.get("sections", [])
        subj = session.get("subject")
        start_at = session.get("start_at")

        if prog and subj and start_at:
            # Get students for that last session
            students = list(db.students.find({
                "programme": prog, "branch": branch, "semester": sem, "section": {"$in": sections}
            }))
            for s in students:
                log_entries = list(db.attendance.find({
                    "student_id": s["_id"], "subject": subj, "date": {"$gte": start_at.strftime("%Y-%m-%d")}
                }))
                log_entry = None
                for entry in log_entries:
                    entry_dt = datetime.strptime(f"{entry['date']} {entry['time']}", "%Y-%m-%d %H:%M:%S")
                    if entry_dt >= start_at:
                        if not log_entry or entry_dt > datetime.strptime(f"{log_entry['date']} {log_entry['time']}", "%Y-%m-%d %H:%M:%S"):
                            log_entry = entry
                
                # We only show students who were ACTUALLY marked present in history for clarity,
                # or we show the whole list? The user said "show current session log".
                # Showing just the present ones is cleaner for a "Summary".
                if log_entry:
                    logs.append({
                        "studentId": str(s["_id"]),
                        "name": s.get("name"),
                        "enrollmentNumber": s.get("enrollment_number"),
                        "subject": subj,
                        "time": log_entry.get("time"),
                        "is_online": False,
                        "source": log_entry.get("source", "auto")
                    })
        else:
            # Fallback for very first run or clear DB
            recent_logs = list(db.attendance.find().sort("_id", -1).limit(20))
            for al in recent_logs:
                student = db.students.find_one({"_id": al.get("student_id")})
                logs.append({
                    "studentId": str(al.get("student_id")),
                    "name": student.get("name") if student else "Unknown",
                    "enrollmentNumber": student.get("enrollment_number") if student else "N/A",
                    "subject": al.get("subject"),
                    "date": al.get("date"),
                    "time": al.get("time"),
                    "is_online": False,
                    "source": al.get("source", "auto")
                })
            
    return jsonify({
        "success": True, 
        "logs": logs, 
        "is_active": bool(session and session.get("is_active")),
        "session": {
            "programme": session.get("programme") if session else None,
            "branch": session.get("branch") if session else None,
            "semester": session.get("semester") if session else None,
            "sections": session.get("sections", []) if session else [],
            "subject": session.get("subject") if session else None
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
    branch = session.get("branch")
    sem = session.get("semester")
    sections = session.get("sections", [])
    subj = session.get("subject")

    students = list(db.students.find({
        "programme": prog,
        "branch": branch,
        "semester": sem,
        "section": {"$in": sections}
    }))

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
    if session:
        return jsonify({
            "programme": session.get("programme"),
            "branch": session.get("branch"),
            "semester": session.get("semester"),
            "sections": session.get("sections", []),
            "subject": session.get("subject"),
            "is_active": bool(session.get("is_active"))
        })
    return jsonify({"is_active": False})

@app.route("/api/timetable/current", methods=["GET"])
def get_current_timetable():
    now = datetime.now()
    day = now.strftime("%A")
    time_str = now.strftime("%H:%M")
    
    # Find subject where start_time <= current_time <= end_time
    entry = db.timetable.find_one({
        "day": day,
        "start_time": {"$lte": time_str},
        "end_time": {"$gte": time_str}
    })
    
    if entry:
        return jsonify({
            "success": True, 
            "subject": entry.get("subject"),
            "programme": entry.get("programme"),
            "branch": entry.get("branch"),
            "semester": entry.get("semester"),
            "section": entry.get("section")
        })
    return jsonify({"success": False, "error": "No subject scheduled at this time"})


@app.route("/api/export/csv", methods=["GET"])
def export_csv():
    cursor = db.attendance.find().sort("_id", 1)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student Name", "Enrollment Number", "Subject", "Date", "Time"])
    
    for al in cursor:
        student = db.students.find_one({"_id": al.get("student_id")})
        writer.writerow([
            student.get("name") if student else "Unknown",
            student.get("enrollment_number") if student else "N/A",
            al.get("subject"),
            al.get("date"),
            al.get("time")
        ])
    
    response = Response(output.getvalue(), mimetype="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=attendance_report.csv"
    return response

@app.route("/api/sections", methods=["GET"])
def get_sections():
    programme = request.args.get("programme", "").lower().strip()
    branch = request.args.get("branch", "").lower().strip()
    semester = str(request.args.get("semester", "")).strip()
    
    if not programme or not branch or not semester:
        return jsonify({"success": False, "error": "Missing parameters"}), 400
        
    sections = db.students.distinct("section", {
        "programme": programme,
        "branch": branch,
        "semester": semester
    })
    
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
    print("🔄 Resetting active session on startup...")

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
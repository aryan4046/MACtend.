import subprocess
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import sys
import time
from datetime import datetime
from database import db

import platform
MINIMUM_CONNECTION_SECONDS = 5    # Require 5 seconds of active connection before marking
LIVE_TIMEOUT_SECONDS = 15          # For dynamic live detection
def get_connected_macs():
    """Scans the ARP table and returns a dict mapping DYNAMIC MAC addresses to their IP."""
    macs = {}
    own_macs = set()
    
    try:
        if platform.system() == "Windows":
            # Get host's own MACs to exclude them
            try:
                getmac_out = subprocess.check_output("getmac", shell=True).decode(errors="ignore")
                for line in getmac_out.splitlines():
                    if "-" in line:
                        m = line.split()[0].replace("-", ":").upper()
                        if len(m) == 17: own_macs.add(m)
            except: pass

            # Try arp lookup with improved parsing (matching app.py logic)
            output = subprocess.check_output("arp -a", shell=True).decode(errors="ignore")
            for line in output.splitlines():
                parts = line.split()
                # A valid ARP entry usually has 3 parts: IP, MAC, Type
                # Sometimes there's extra whitespace or dashes
                for i, part in enumerate(parts):
                    # Check if this part looks like a MAC address
                    mac_candidate = part.replace("-", ":").upper()
                    if len(mac_candidate) == 17 and mac_candidate.count(":") == 5:
                        # The IP is usually the part before the MAC
                        if i > 0:
                            ip_candidate = parts[i-1]
                            if not mac_candidate.startswith("01:00:5E") and not mac_candidate.startswith("33:33:"):
                                if mac_candidate not in own_macs:
                                    macs[mac_candidate] = ip_candidate
                            
            # Add IPv6 neighbors 
            try:
                ipv6_out = subprocess.check_output("netsh interface ipv6 show neighbors", shell=True).decode(errors="ignore")
                for line in ipv6_out.splitlines():
                    if "-" in line:
                        parts = line.split()
                        # Extract MAC from any part holding it
                        for part in parts:
                            part_mac = part.replace("-", ":").upper()
                            if len(part_mac) == 17 and part_mac.count(":") == 5:
                                if part_mac not in own_macs:
                                    # For IPv6, just use the first part as IP
                                    macs[part_mac] = parts[0]
            except: pass
        else:
            # Linux setup (Raspberry Pi)
            try:
                net_dir = "/sys/class/net/"
                if os.path.exists(net_dir):
                    for iface in os.listdir(net_dir):
                        try:
                            with open(os.path.join(net_dir, iface, "address"), "r") as f:
                                own_macs.add(f.read().strip().upper())
                        except: pass
            except: pass
            
            output = subprocess.check_output("ip neigh", shell=True).decode()
            for line in output.splitlines():
                parts = line.split()
                if not parts: continue
                state = parts[-1].upper()
                if state in ["REACHABLE", "STALE", "DELAY"] and "lladdr" in parts:
                    idx = parts.index("lladdr")
                    ip = parts[0]
                    if idx + 1 < len(parts):
                        mac = parts[idx + 1].upper()
                        if len(mac) == 17 and mac.count(":") == 5:
                            if mac not in own_macs:
                                macs[mac] = ip
    except Exception as e:
        print(f"Error scanning ARP table: {e}")
    return macs

def mark_attendance():
    """Main function to scan devices and mark attendance based on active session."""
    session = db.active_session.find_one({"id": 1})
    
    if not session or not session.get("is_active"):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] No active session. Skipping scan.")
        return

    # Check for 5-minute expiry (300 seconds)
    start_at = session.get("start_at")
    if start_at:
        # Some DB drivers return datetime objects directly
        # Ensure we are comparing correctly
        now = datetime.now()
        elapsed = (now - start_at).total_seconds()
        
        if elapsed > 300:
            print(f"[EXPIRED] Session for {session.get('subject')} timed out. Stopping scanner.")
            db.active_session.update_one({"id": 1}, {"$set": {"is_active": False}})
            return

    programme = session.get("programme")
    branch = session.get("branch")
    semester = session.get("semester")
    sections = session.get("sections", [])
    subject = session.get("subject")
    college = session.get("college", "") # Added this line to fix the error

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Active Session: {subject} ({branch}). Scanning...")

    connected_macs = get_connected_macs()
    now = datetime.now()
    today = now.strftime("%Y-%m-%d")

    # Use case-insensitive regex for all filters to ensure maximum compatibility
    def ci_reg(val): return {"$regex": f"^{str(val).strip()}$", "$options": "i"}

    # sections is already a list, make each element a case-insensitive regex
    section_queries = [{"section": ci_reg(sec)} for sec in sections]

    query = {
        "programme": ci_reg(programme),
        "branch": ci_reg(branch),
        "semester": ci_reg(semester),
        "$or": section_queries, # Use $or for sections
        "$and": [ # Flexible college check
            {"$or": [
                {"college": ci_reg(college)},
                {"college": {"$exists": False}},
                {"college": ""}
            ]}
        ]
    }

    students = list(db.students.find(query))

    start_at = session.get("start_at")
    if not start_at:
        start_date_str = session.get("start_date", today)
        start_time_str = session.get("start_time", "00:00:00")
        start_at = datetime.strptime(f"{start_date_str} {start_time_str}", "%Y-%m-%d %H:%M:%S")

    # Create a normalized version of connected_macs (all uppercase) for easy matching
    norm_connected = {m.upper(): ip for m, ip in connected_macs.items()}

    for s in students:
        db_mac = (s.get("mac_address") or "").strip().upper().replace("-", ":")
        connected_since = s.get("connected_since")

        # ----------------------------------
        # 🟢 STUDENT IS CONNECTED (Case-Insensitive Match)
        # ----------------------------------
        if db_mac in norm_connected:
            ip = norm_connected[db_mac]
            
            # --- [ANTI-PROXY: LATENCY MEASUREMENT] ---
            # We measure ping latency to see if they are inside the room
            latency = 999
            try:
                if platform.system() == "Windows":
                    ping_cmd = f"ping -n 1 -w 200 {ip}"
                else:
                    ping_cmd = f"ping -c 1 -W 1 {ip}"
                    
                ping_out = subprocess.check_output(ping_cmd, shell=True).decode()
                
                if "time=" in ping_out:
                    time_str = ping_out.split("time=")[1].split("ms")[0]
                    # Use float then int to handle Linux returning decimal like time=1.23ms
                    latency = int(float(time_str.split("<")[-1].strip()))
                elif "time<1ms" in ping_out:
                    latency = 1
            except:
                pass
                
            # Assume any packet loss or latency > 150ms is outside the room ("Weak")
            if latency <= 100:
                signal_level = "Strong"
            elif latency <= 150:
                signal_level = "Medium"
            elif latency < 999: # Still reachable, but very slow ping
                signal_level = "Weak (Blocked)"
            else:
                signal_level = "Offline" # Ping failed completely. Device disconnected, just lingering in ARP.
                
            if signal_level != "Offline":
                # ALWAYS update DB with live values so Teacher UI reacts instantly
                db.students.update_one(
                    {"_id": s["_id"]},
                    {"$set": {
                        "last_seen": now.isoformat(),
                        "signal_strength": signal_level
                    }}
                )

                # Process attendance regardless of signal strength (Strong/Medium/Weak)
                # If they were last seen a long time ago (e.g. session stopped), reset the timer!
                last_seen_str = s.get("last_seen")
                if last_seen_str:
                    try:
                        last_seen_time = datetime.fromisoformat(last_seen_str)
                        if (now - last_seen_time).total_seconds() > 60:
                            connected_since = None # Force a restart of the timer
                    except:
                        pass
                        
                # First time detected
                if not connected_since:
                    connected_since = now.isoformat()
                    db.students.update_one(
                        {"_id": s["_id"]},
                        {"$set": {"connected_since": connected_since}}
                    )
                    # Don't 'continue' here anymore - mark them present immediately!

                # Already connected — check duration
                try:
                    connected_time = datetime.fromisoformat(connected_since)
                    duration = (now - connected_time).total_seconds()
                except:
                    duration = 0

                if duration >= MINIMUM_CONNECTION_SECONDS:

                    log_entries = list(db.attendance.find({
                        "student_id": s["_id"],
                        "subject": subject,
                        "date": {"$gte": start_at.strftime("%Y-%m-%d")}
                    }))

                    already_marked = False
                    for entry in log_entries:
                        try:
                            entry_dt = datetime.strptime(f"{entry['date']} {entry['time']}", "%Y-%m-%d %H:%M:%S")
                            if entry_dt >= start_at:
                                already_marked = True
                                break
                        except Exception:
                            pass

                    if not already_marked:
                        db.attendance.insert_one({
                            "student_id": s["_id"],
                            "subject": subject,
                            "date": today,
                            "time": now.strftime("%H:%M:%S"),
                            "source": "auto",
                            "connection_duration": int(duration)
                        })

                        print(f"[OK] Attendance Marked: {s.get('name')} (Signal: {signal_level})")
                
                # Continue loop so it doesn't run the disconnect block
                continue

        # ----------------------------------
        # RED STUDENT IS DISCONNECTED
        # ----------------------------------
        # If they reached this point, they are NOT in connected_macs, OR their ping failed (Offline)
        
        # Clear the signal strength from DB so UI doesn't get stuck on "Weak" when they leave
        db.students.update_one({"_id": s["_id"]}, {"$set": {"signal_strength": "--"}})
        
        needs_reset = False
        end_time_for_calc = now
        
        # Completely disconnected. Use 30s grace period.
        last_seen_str = s.get("last_seen")
        if last_seen_str:
            try:
                last_seen_time = datetime.fromisoformat(last_seen_str)
                if (now - last_seen_time).total_seconds() > 30:
                    needs_reset = True
                    end_time_for_calc = last_seen_time
            except: pass
            
        if needs_reset and connected_since:
            try:
                conn_since_time = datetime.fromisoformat(connected_since)
                total_duration = (end_time_for_calc - conn_since_time).total_seconds()
                
                # If total actual connection time was less than 5 minutes (300 seconds)
                if total_duration < 300:
                    log_entries = list(db.attendance.find({
                        "student_id": s["_id"],
                        "subject": subject,
                        "date": {"$gte": start_at.strftime("%Y-%m-%d")}
                    }))
                    
                    for entry in log_entries:
                        try:
                            entry_dt = datetime.strptime(f"{entry['date']} {entry['time']}", "%Y-%m-%d %H:%M:%S")
                            if entry_dt >= start_at:
                                db.attendance.delete_one({"_id": entry["_id"]})
                                print(f"[REVOKED] Attendance Revoked (disconnected before 5 min): {s.get('name')}")
                        except Exception:
                            pass
                            
                # Reset connection timer so they have to start over
                db.students.update_one(
                    {"_id": s["_id"]},
                    {"$set": {"connected_since": None}}
                )
            except Exception as e:
                print(f"Error handling disconnect for {s.get('name')}: {e}")

    # --- [NEW: UNMATCHED DEVICE LOGGING] ---
    # Record any connected MACs that didn't match a student in this session
    unmatched = [m for m in connected_macs if m not in [st.get("mac_address") for st in students]]
    if unmatched:
        db.active_session.update_one(
            {"id": 1}, 
            {"$set": {"unmatched_macs": unmatched}}
        )
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Detected {len(unmatched)} unknown device(s) near server.")
if __name__ == "__main__":
    print("Starting MongoDB-based Background Attendance Scanner...")
    print("Press Ctrl+C to stop.")
    try:
        while True:
            mark_attendance()
            time.sleep(5)
    except KeyboardInterrupt:
        print("\nScanner stopped.")

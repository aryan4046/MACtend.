import subprocess
import platform
import os
from database import db
from datetime import datetime

def get_connected_devices():
    """Scans the ARP table to find all connected devices and their MACs."""
    devices = []
    own_macs = set()
    
    # Identify local machine's MAC addresses to exclude them
    try:
        if platform.system() == "Windows":
            getmac_out = subprocess.check_output("getmac", shell=True).decode(errors="ignore")
            for line in getmac_out.splitlines():
                if "-" in line:
                    m = line.split()[0].replace("-", ":").upper()
                    if len(m) == 17: own_macs.add(m)
        else:
            net_dir = "/sys/class/net/"
            if os.path.exists(net_dir):
                for iface in os.listdir(net_dir):
                    try:
                        with open(os.path.join(net_dir, iface, "address"), "r") as f:
                            own_macs.add(f.read().strip().upper())
                    except: pass
    except: pass

    try:
        if platform.system() == "Windows":
            # Populate ARP cache
            subprocess.call("arp -a > NUL 2>&1", shell=True)
            output = subprocess.check_output("arp -a", shell=True).decode(errors="ignore")
            
            for line in output.splitlines():
                parts = line.split()
                if len(parts) >= 2:
                    ip = parts[0]
                    mac = parts[1].replace("-", ":").upper()
                    if len(mac) == 17 and mac.count(":") == 5:
                        if mac not in own_macs and not mac.startswith("01:00:5E"):
                            devices.append({"ip": ip, "mac": mac})
        else:
            output = subprocess.check_output("ip neigh show", shell=True).decode(errors="ignore")
            for line in output.splitlines():
                parts = line.split()
                if "lladdr" in parts:
                    idx = parts.index("lladdr")
                    ip = parts[0]
                    mac = parts[idx+1].upper()
                    if mac not in own_macs:
                        devices.append({"ip": ip, "mac": mac})
    except Exception as e:
        print(f"[ERROR] Scan failed: {e}")
        
    return devices

def run_detector():
    print("\n" + "="*60)
    print(f"   LIVE DEVICE & MAC DETECTOR ({datetime.now().strftime('%H:%M:%S')})")
    print("="*60)
    print(f"{'IP ADDRESS':15} | {'MAC ADDRESS':17} | {'STUDENT NAME'}")
    print("-" * 60)
    
    devices = get_connected_devices()
    
    if not devices:
        print("   No external devices detected in ARP cache.")
        print("   -> Tip: Ensure client devices are pinging this PC or browsing the website.")
    else:
        for dev in devices:
            # Check if this MAC is in our database
            student = db.students.find_one({"mac_address": dev["mac"]})
            name = student["name"] if student else "--- (Not Registered)"
            print(f"{dev['ip']:15} | {dev['mac']:17} | {name}")
            
    print("="*60 + "\n")

if __name__ == "__main__":
    run_detector()

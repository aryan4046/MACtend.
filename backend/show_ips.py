import subprocess
import re

print("\n" + "="*56)
print("   AVAILABLE ATTENDANCE LINKS FOR PHONES:")
print("="*56 + "\n")

print("   -> This PC (Local):   http://localhost:5173/\n")

try:
    output = subprocess.check_output("ipconfig", shell=True).decode(errors='ignore')
    ips = re.findall(r"IPv4 Address[.\s]+:\s*([\d.]+)", output)
    
    for ip in ips:
        if ip.startswith("192.168.137"):
            print(f"   -> Hotspot (RECOMMENDED): http://{ip}:5173/")
        else:
            print(f"   -> Wi-Fi / LAN:           http://{ip}:5173/")
except Exception as e:
    pass

print("\n" + "="*56 + "\n")

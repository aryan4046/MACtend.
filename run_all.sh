#!/bin/bash

# =============================================================
#      ___  ___  ___  _____               _
#      |  \/  | / _ \/  __ \             | |
#      | .  . |/ /_\ \ /  \/_ __ ___   __| |
#      | | | | |  _  | |   | '__/ _ \ / _` |
#      | | | | | | | | \__/\ | |  __/ (_| |
#      \_| |_/\_| |_/\____/\_|  \___|\__,_|
#
#          Smart IoT Attendance System (LINUX)
# =============================================================

echo -e "\e[1;34m[!] Checking environment...\e[0m"

# Check if .venv exists, create if not
if [ ! -d "backend/.venv" ]; then
    echo -e "\e[1;33m[!] Creating Python Virtual Environment...\e[0m"
    python3 -m venv backend/.venv
    source backend/.venv/bin/activate
    pip install -r backend/requirements.txt
else
    source backend/.venv/bin/activate
fi

echo -e "\e[1;32m[OK] Environment verified.\e[0m"

echo -e "\e[1;34m[!] Cleaning up old processes...\e[0m"
pkill -f "python3 backend/app.py"
pkill -f "python3 backend/scanner.py"
pkill -f "vite"

echo -e "\e[1;36m[1/3] Starting Backend Server (Port 5000)...\e[0m"
python3 backend/app.py > backend_log.txt 2>&1 &

echo -e "\e[1;36m[2/3] Starting Attendance Scanner Engine...\e[0m"
# Scanner might need sudo for certain low-level network operations
sudo backend/.venv/bin/python3 backend/scanner.py > scanner_log.txt 2>&1 &

echo -e "\e[1;36m[3/3] Starting Frontend (Vite UI)...\e[0m"
cd frontend && npm run dev -- --host > ../frontend_log.txt 2>&1 &

echo -e "\e[1;32m-------------------------------------------------------------\e[0m"
echo -e "\e[1;32m SUCCESS: ALL COMPONENTS ARE INITIALIZING ON LINUX/PI\e[0m"
echo -e "\e[1;32m-------------------------------------------------------------\e[0m"
echo -e " Backend: http://localhost:5000"
echo -e " Frontend: http://localhost:5173"
echo -e ""
echo -e " To stop everything, run: pkill -f \"python3\" && pkill -f \"vite\""
echo -e "-------------------------------------------------------------"
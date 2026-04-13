#!/bin/bash

# Force directory to where the script is located
cd "$(dirname "$0")" || exit 1

echo "===================================================="
echo "     Smart IoT Attendance System Launcher (Linux)   "
echo "===================================================="
echo ""

# -----------------------------
# 0. START DOCKER + MONGODB
# -----------------------------

echo "[0/4] Checking MongoDB Docker container..."

# Check if Docker is running
if ! systemctl is-active --quiet docker; then
    echo "[!] Docker is not running. Starting Docker..."
    sudo systemctl start docker
    sleep 3
fi

# Check if Mongo container exists
if ! sudo docker ps -a --format '{{.Names}}' | grep -q "^mongodb$"; then
    echo "[!] MongoDB container not found. Creating new one..."
    sudo docker run -d \
        --name mongodb \
        -p 27017:27017 \
        mongo:7
    sleep 5
else
    # If exists but stopped, start it
    if ! sudo docker ps --format '{{.Names}}' | grep -q "^mongodb$"; then
        echo "[!] Starting existing MongoDB container..."
        sudo docker start mongodb
        sleep 5
    fi
fi

# Wait until MongoDB is ready
echo "[!] Waiting for MongoDB to be ready..."
until sudo docker exec mongodb mongosh --eval "db.runCommand({ ping: 1 })" &>/dev/null
do
    sleep 2
done

echo "[✓] MongoDB is running."

# -----------------------------
# 1. Setup Python Virtual Environment
# -----------------------------

VENV_DIR="venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "[!] Virtual environment not found. Creating one..."
    python3 -m venv $VENV_DIR
    echo "[!] Installing dependencies..."
    $VENV_DIR/bin/pip install -r requirements.txt
fi

# Install frontend deps if missing
if [ ! -d "frontend/node_modules" ]; then
    echo "[!] node_modules not found. Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# -----------------------------
# CLEANUP FUNCTION
# -----------------------------

cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    kill $SCANNER_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# -----------------------------
# 2. Launch Backend
# -----------------------------

echo "[1/4] Starting Backend (Port 5000)..."
cd backend
../$VENV_DIR/bin/python app.py &
BACKEND_PID=$!
cd ..
sleep 2

# -----------------------------
# 3. Launch Scanner
# -----------------------------

echo "[2/4] Starting Attendance Scanner..."
cd backend
../$VENV_DIR/bin/python scanner.py &
SCANNER_PID=$!
cd ..
sleep 2

# -----------------------------
# 4. Launch Frontend
# -----------------------------

echo "[3/4] Starting Frontend (Vite UI)..."
cd frontend
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!
cd ..

echo ""
echo "----------------------------------------------------"
echo "ALL COMPONENTS HAVE BEEN LAUNCHED!"
echo "----------------------------------------------------"
echo "Backend: http://localhost:5000"
echo "Frontend: http://10.42.0.1:5173"
echo "MongoDB: Docker container (mongodb)"
echo "Press Ctrl+C to stop all services."
echo ""

wait
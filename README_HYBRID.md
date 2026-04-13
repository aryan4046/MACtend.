# 🐧 MACtend: Hybrid Setup Guide (Windows & Raspberry Pi)

This project is built to run seamlessly on both **Windows (PC)** and **Raspberry Pi OS**. The system automatically detects its host environment and adjusts its network scanning logic.

## 🪟 Working on Windows
To start the project on Windows:
1. Ensure MongoDB is running locally.
2. Double-click `run_all.bat`.
3. The UI will open at `http://localhost:5173`.

## 🥧 Working on Raspberry Pi OS
The Pi version is optimized for "headless" operation and ARM performance.

### 1. Initial Setup
Run these commands once on your Pi:
```bash
sudo apt update
sudo apt install -y mongodb python3-venv nodejs npm
chmod +x run_all.sh
```

### 2. Starting the System
```bash
./run_all.sh
```

### 3. Key Hybrid Features
- **Dynamic IP**: The Frontend automatically connects to the Pi's IP on the network.
- **Headless OpenCV**: Uses optimized drivers for Pi performance.
- **Smart ARP**: Uses `ip neigh` on Linux for high-speed device detection.

## 🛠️ Troubleshooting Hybrid Detection
If the Pi cannot see devices:
1. Ensure the Pi is acting as a **WiFi Access Point** or is on the same subnet as students.
2. Run `sudo ./run_all.sh` if the scanner logs show permission errors.

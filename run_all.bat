@echo off
setlocal enabledelayedexpansion

:: 1. Force directory to where the script is located
cd /d "%~dp0"

title Smart Attendance System - Master Launcher
echo ====================================================
echo      Smart IoT Attendance System Launcher
echo ====================================================
echo.
echo [!] Attempting to close any existing running instances...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
echo.

:: 2. Launch Backend
echo [1/3] Starting Backend (Port 5000)...
start "Backend Server" cmd /k "cd backend && ..\.venv\Scripts\python.exe app.py"
timeout /t 2 >nul

:: 3. Launch Scanner
echo [2/3] Starting Attendance Scanner...
start "Attendance Scanner" cmd /k "cd backend && ..\.venv\Scripts\python.exe scanner.py"
timeout /t 2 >nul

:: 4. Launch Frontend
echo [3/3] Starting Frontend (Vite UI)...

:: Make sure Vite binds to all network interfaces so it prints the IP addresses correctly
start "Frontend UI" cmd /k "python backend\show_ips.py & cd frontend & npm run dev"

echo.
echo ----------------------------------------------------
echo ALL COMPONENTS HAVE BEEN LAUNCHED!
echo ----------------------------------------------------
echo Look for 3 new terminal windows on your taskbar.
echo.
echo This launcher window will auto-close in 5 seconds.
timeout /t 5 >nul
exit

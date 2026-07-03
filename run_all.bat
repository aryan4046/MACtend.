@echo off
setlocal

:: Force directory to where the script is located
cd /d "%~dp0"

:: Set Colors (Blue background/White text for header)
color 0B

title MACtend - Master Launcher
echo.
echo  =============================================================
echo       ___  ___  ___  _____               _ 
echo       ^|  \/  ^| / _ \/  __ \             ^| ^|
echo       ^| .  . ^|/ /_\ \ /  \/_ __ ___   __^| ^|
echo       ^| ^| ^| ^| ^|  _  ^| ^|   ^| '__/ _ \ / _` ^|
echo       ^| ^| ^| ^| ^| ^| ^| ^| \__/\ ^| ^|  __/ (_^| ^|
echo       \_^| ^|_^/\_^| ^|_/\____/\_^|  \___^|\__,_^|
echo.
echo           Smart IoT Attendance System Launcher
echo  =============================================================
echo.

:: 1. Dependency Checks
echo [!] Checking environment...

if exist .venv goto :venv_ok
color 0C
echo [ERROR] Virtual environment (.venv) not found.
echo Please create it using: python -m venv .venv
pause
exit /b

:venv_ok
if exist frontend\node_modules goto :modules_ok
echo [!] node_modules missing. Attempting to install frontend dependencies...
cd frontend && npm install && cd ..

:modules_ok

echo [OK] Environment verified.
echo.

:: 2. Cleanup
echo [!] Cleaning up old processes...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
echo [OK] Clean state.
echo.

:: 3. Launch Backend
echo [1/4] Starting Backend Server (Port 5000)...
start "MACtend Backend" cmd /k "title Backend Server && cd backend && ..\.venv\Scripts\python.exe app.py"
timeout /t 3 >nul

:: 4. Launch Scanner
echo [2/4] Starting Attendance Scanner Engine...
start "MACtend Scanner" cmd /k "title Attendance Scanner && cd backend && ..\.venv\Scripts\python.exe scanner.py"
timeout /t 2 >nul

:: 5. Launch RSSI Service
echo [3/4] Starting RSSI Signal Service (Port 5001)...
start "MACtend RSSI" cmd /k "title RSSI Service && cd backend && ..\.venv\Scripts\python.exe rssi_service.py"
timeout /t 2 >nul

:: 6. Launch Frontend
echo [4/4] Starting Frontend (Vite UI)...
:: Run show_ips.py first to give the user their URLs, then start Vite
start "MACtend Frontend" cmd /k "title Frontend UI && .venv\Scripts\python.exe backend\show_ips.py && cd frontend && npm run dev"

echo.
echo  -------------------------------------------------------------
echo  SUCCESS: ALL COMPONENTS ARE INITIALIZING
echo  -------------------------------------------------------------
echo  Check your taskbar for 4 new terminal windows:
echo   1. Backend Server (Flask API)
echo   2. Attendance Scanner (IoT Logic)
echo   3. RSSI Signal Service (Telemetry Daemon)
echo   4. Frontend UI (Vite + React)
echo.
echo  Closing this launcher in 10 seconds...
timeout /t 10 >nul
exit

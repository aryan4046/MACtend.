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

if not exist .venv (
    color 0C
    echo [ERROR] Virtual environment (.venv) not found.
    echo Please create it using: python -m venv .venv
    pause
    exit /b
)

if not exist frontend\node_modules (
    echo [!] node_modules missing. Attempting to install frontend dependencies...
    cd frontend && npm install && cd ..
)

echo [OK] Environment verified.
echo.

:: 2. Cleanup
echo [!] Cleaning up old processes...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
echo [OK] Clean state.
echo.

:: 3. Launch Backend
echo [1/3] Starting Backend Server (Port 5000)...
start "MACtend Backend" cmd /k "title Backend Server && cd backend && ..\.venv\Scripts\python.exe app.py"
timeout /t 3 >nul

:: 4. Launch Scanner
echo [2/3] Starting Attendance Scanner Engine...
start "MACtend Scanner" cmd /k "title Attendance Scanner && cd backend && ..\.venv\Scripts\python.exe scanner.py"
timeout /t 2 >nul

:: 5. Launch Frontend
echo [3/3] Starting Frontend (Vite UI)...
:: Run show_ips.py first to give the user their URLs, then start Vite
start "MACtend Frontend" cmd /k "title Frontend UI && .venv\Scripts\python.exe backend\show_ips.py && cd frontend && npm run dev"

echo.
echo  -------------------------------------------------------------
echo  SUCCESS: ALL COMPONENTS ARE INITIALIZING
echo  -------------------------------------------------------------
echo  Check your taskbar for 3 new terminal windows:
echo   1. Backend Server (Flask API)
echo   2. Attendance Scanner (IoT Logic)
echo   3. Frontend UI (Vite + React)
echo.
echo  Closing this launcher in 10 seconds...
timeout /t 10 >nul
exit

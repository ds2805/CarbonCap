@echo off
echo ===================================================
echo   CarbonCap - One-Step Environment Setup
echo ===================================================
echo.

echo 1. Creating Python Virtual Environment (venv)...
if not exist venv (
    python -m venv venv
)
echo.

echo 2. Installing Python Backend Dependencies...
call .\venv\Scripts\pip install -r requirements.txt
echo.

echo 3. Initializing Database and ML Model...
call .\venv\Scripts\python init_demo_data.py
echo.

echo 4. Installing Mobile App Dependencies (npm)...
cd CarbonCapMobile
call npm install
cd ..
echo.

echo ===================================================
echo   Setup Complete!
echo   To run the project:
echo   - Backend: run_backend.bat
echo   - Mobile:  run_mobile.bat
echo ===================================================
pause

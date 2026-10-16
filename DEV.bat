@echo off
setlocal
cd /d "%~dp0"

echo Starting Motor Web development server...
echo Open https://localhost:8081/ (or https://motor.web:8081/)
echo Press Ctrl+C to stop.
echo.

call npm run dev
set "exitCode=%errorlevel%"

if not "%exitCode%"=="0" (
    echo.
    echo ERROR: Development server exited with code %exitCode%.
    pause
)

exit /b %exitCode%

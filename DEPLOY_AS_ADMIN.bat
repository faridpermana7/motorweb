@echo off
REM Production deployment to the configured IIS site.
REM Right-click this file and select "Run as administrator".

echo.
echo =========================================
echo  Motor Web - Production IIS Deployment
echo =========================================
echo.

REM Check for admin privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script requires Administrator privileges!
    echo.
    echo Right-click this file and select "Run as administrator".
    echo Production deployment writes to C:\inetpub\wwwroot\motorweb.
    echo.
    pause
    exit /b 1
)

REM Navigate to project directory
cd /d "%~dp0"

REM Run the deployment
echo Running production build and IIS deployment: npm run deploy
echo.
call npm run deploy
set "exitCode=%errorlevel%"

if not "%exitCode%"=="0" (
    echo.
    echo ERROR: Production deployment failed with code %exitCode%.
    pause
    exit /b %exitCode%
)

echo.
echo SUCCESS: Deployment completed!
pause
exit /b 0

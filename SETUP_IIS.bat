@echo off
REM Complete IIS Setup and Deployment Script
REM Must run as Administrator
cls

echo.
echo =====================================================
echo Motor Web - IIS Complete Setup
echo =====================================================
echo.

REM Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script requires Administrator privileges
    echo Please right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [1/5] Stopping IIS services...
net stop W3SVC /y >nul 2>&1
net stop WAS /y >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/5] Creating/Updating IIS site...
REM Use appcmd to manage IIS configuration
"C:\Windows\System32\inetsrv\appcmd.exe" delete site "motor" >nul 2>&1
"C:\Windows\System32\inetsrv\appcmd.exe" delete apppool "motor" >nul 2>&1
timeout /t 1 /nobreak >nul

REM Create app pool
echo Creating application pool...
"C:\Windows\System32\inetsrv\appcmd.exe" add apppool /name:"motor" /managedRuntimeVersion:"v4.0" /managedPipelineMode:"Integrated" /autoStart:true

REM Create website
echo Creating website binding...
"C:\Windows\System32\inetsrv\appcmd.exe" add site /name:"motor" /bindings:"https/*:10000:motor.web,http/*:80:motor.web" /physicalPath:"C:\inetpub\wwwroot\motorweb"
"C:\Windows\System32\inetsrv\appcmd.exe" set site /site.name:"motor" /[path='/'].applicationPool:"motor"

echo [3/5] Setting file permissions...
REM Set NTFS permissions for IIS_IUSRS
icacls "C:\inetpub\wwwroot\motorweb" /grant "IIS_IUSRS:(OI)(CI)M" /t /c /q
icacls "C:\inetpub\wwwroot\motorweb" /grant "IUSR:(OI)(CI)R" /t /c /q

echo [4/5] Deploying files...
cd /d "D:\project\motorweb"
echo Building project...
call npm run build:prod >nul 2>&1

echo Copying dist files...
xcopy dist\* "C:\inetpub\wwwroot\motorweb\" /E /Y /Q /I

echo Copying web.config...
copy /Y web.config "C:\inetpub\wwwroot\motorweb\web.config" >nul

echo [5/5] Starting IIS services...
net start WAS >nul 2>&1
timeout /t 2 /nobreak >nul
net start W3SVC >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo =====================================================
echo Setup Complete!
echo =====================================================
echo.
echo Website: http://motor.web
echo HTTPS: https://motor.web:10000
echo.

REM Verify deployment
echo Verifying files...
if exist "C:\inetpub\wwwroot\motorweb\pages\sign-in.html" (
    echo ✓ Pages deployed
)
if exist "C:\inetpub\wwwroot\motorweb\assets\css\material-dashboard.css" (
    echo ✓ CSS files deployed
)
if exist "C:\inetpub\wwwroot\motorweb\web.config" (
    echo ✓ web.config deployed
)

echo.
echo Opening site in browser...
timeout /t 2 /nobreak >nul
start https://motor.web:10000

echo.
pause

@echo off
REM Compatibility alias; use DEPLOY_AS_ADMIN.bat for production deployment.
call "%~dp0DEPLOY_AS_ADMIN.bat"
exit /b %errorlevel%

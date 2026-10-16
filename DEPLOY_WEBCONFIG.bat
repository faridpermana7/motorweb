@echo off
REM Compatibility alias; production deployment also copies web.config.
call "%~dp0DEPLOY_AS_ADMIN.bat"
exit /b %errorlevel%

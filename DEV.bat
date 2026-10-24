@echo off
setlocal
cd /d "%~dp0"

node "%~dp0scripts\dev-logger.cjs"
exit /b %errorlevel%

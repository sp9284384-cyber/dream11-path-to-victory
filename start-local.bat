@echo off
cd /d "%~dp0"
echo Starting Dream11 Path to Victory Local Server...
echo Opening http://localhost:3000 in your browser...
start http://localhost:3000
node server.js
pause

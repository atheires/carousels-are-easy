@echo off
rem Starts Carousels Are Easy and opens it in your browser. Leave this window open while you use the app.
cd /d "%~dp0App"
where node >nul 2>nul || (echo Node.js is not installed. Get it from https://nodejs.org and run this again. & pause & exit /b)
start "" http://127.0.0.1:4330
node server.cjs
pause

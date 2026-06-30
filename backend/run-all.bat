@echo off
title Tani Tinggi — Launcher
echo ==========================================
echo Menjalankan Tani Tinggi (Infra + App)
echo ==========================================

:: 1. Start Redis
echo [+] Menjalankan Redis...
start "Tani Tinggi Cache (Redis)" /min "%~dp0redis\redis-server.exe" --port 6379

:: 2. Start Postgres
echo [+] Menjalankan PostgreSQL...
start "Tani Tinggi Database (Postgres)" /min "%~dp0pgsql\pgsql\bin\postgres.exe" -D "%~dp0pgsql\pgsql\data"

:: Wait for DB and Redis to stabilize
echo [+] Menunggu database dan cache siap (5 detik)...
timeout /t 5 /nobreak >nul

:: 3. Start Backend API
echo [+] Menjalankan Backend API...
start "Tani Tinggi Backend API" cmd /k "cd /d %~dp0 && npm run dev"

:: 4. Start Worker
echo [+] Menjalankan Worker...
start "Tani Tinggi Worker Queue" cmd /k "cd /d %~dp0 && npm run dev:worker"

:: 5. Start Frontend
echo [+] Menjalankan Frontend...
start "Tani Tinggi Frontend (Vite)" cmd /k "cd /d %~dp0..\frontend && npm run dev"

echo ==========================================
echo Semua service sedang dijalankan!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:3000
echo ==========================================
pause

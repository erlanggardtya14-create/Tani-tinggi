@echo off
title Tani Tinggi — Stopper
echo ==========================================
echo Mematikan Tani Tinggi (Infra + App)
echo ==========================================

echo [+] Menghentikan PostgreSQL dan Redis...
taskkill /F /IM postgres.exe /T 2>nul
taskkill /F /IM redis-server.exe /T 2>nul

echo [+] Menghentikan proses Node (API, Worker, Frontend)...
:: Menutup jendela cmd yang kita jalankan
taskkill /F /FI "WINDOWTITLE eq Tani Tinggi*" 2>nul
:: Menghentikan proses node.exe
taskkill /F /IM node.exe /T 2>nul

echo ==========================================
echo Semua service berhasil dihentikan!
echo ==========================================
timeout /t 3 >nul

@echo off
title Tani Tinggi — Setup Infra
echo ==========================================
echo Mengunduh dan Menyiapkan Database + Cache
echo ==========================================

:: 1. Buat folder tujuan jika belum ada
if not exist "%~dp0redis" mkdir "%~dp0redis"
if not exist "%~dp0pgsql" mkdir "%~dp0pgsql"

:: 2. Unduh Redis Portable
if not exist "%~dp0redis\redis-server.exe" (
    echo [+] Mengunduh Redis Portable...
    curl.exe -L -o "%~dp0redis.zip" "https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip"
    echo [+] Mengekstrak Redis...
    tar.exe -xf "%~dp0redis.zip" -C "%~dp0redis"
    del "%~dp0redis.zip"
    echo [✔] Redis berhasil disiapkan.
) else (
    echo [i] Redis sudah terpasang.
)

:: 3. Unduh PostgreSQL Portable
if not exist "%~dp0pgsql\pgsql\bin\postgres.exe" (
    echo [+] Mengunduh PostgreSQL 15.3...
    curl.exe -L -o "%~dp0postgres.zip" "https://get.enterprisedb.com/postgresql/postgresql-15.3-1-windows-x64-binaries.zip"
    echo [+] Mengekstrak PostgreSQL (proses ini memakan waktu)...
    tar.exe -xf "%~dp0postgres.zip" -C "%~dp0pgsql"
    del "%~dp0postgres.zip"
    echo [✔] PostgreSQL berhasil diekstrak.
) else (
    echo [i] PostgreSQL sudah terpasang.
)

:: 4. Inisialisasi Database
if not exist "%~dp0pgsql\pgsql\data" (
    echo [+] Membuat kredensial database...
    echo secret> "%~dp0pw.txt"
    
    echo [+] Menginisialisasi PostgreSQL cluster...
    "%~dp0pgsql\pgsql\bin\initdb.exe" -D "%~dp0pgsql\pgsql\data" -U tanitinggi --auth-local=trust --auth-host=trust --pwfile="%~dp0pw.txt"
    
    echo [+] Memulai database sementara untuk membuat skema...
    start "Temporary Postgres" /min "%~dp0pgsql\pgsql\bin\postgres.exe" -D "%~dp0pgsql\pgsql\data"
    
    echo [+] Menunggu database siap (5 detik)...
    timeout /t 5 /nobreak >nul
    
    echo [+] Membuat database 'tanitinggi_db'...
    "%~dp0pgsql\pgsql\bin\createdb.exe" -U tanitinggi -h 127.0.0.1 tanitinggi_db
    
    echo [+] Mematikan database sementara...
    taskkill /F /IM postgres.exe /T >nul 2>&1
    
    del "%~dp0pw.txt"
    echo [✔] Database berhasil diinisialisasi!
) else (
    echo [i] Database cluster sudah terinisialisasi.
)

echo ==========================================
echo Setup selesai!
echo Sekarang jalankan 'run-all.bat' untuk memulai proyek.
echo ==========================================
pause

@echo off
title TecniMotor - Entorno de Desarrollo Full Stack

echo ========================================================
echo          Iniciando Plataforma TecniMotor
echo ========================================================
echo.

:: 1. Iniciar Servidor Backend Django en ventana independiente
echo [1/2] Iniciando Backend Django (Puerto 8000)...
start "TecniMotor - Backend Django" cmd /k "cd /d "%~dp0Backend" && call "..\.venv\Scripts\activate.bat" && python manage.py runserver 8000"

:: 2. Iniciar Servidor Frontend Vite en ventana independiente
echo [2/2] Iniciando Frontend React + Vite (Puerto 5173)...
start "TecniMotor - Frontend React" cmd /k "cd /d "%~dp0Frontend" && npm run dev"

echo.
echo ========================================================
echo   Frontend (Dashboard React): http://localhost:5173/
echo   Backend API REST:           http://127.0.0.1:8000/api/
echo   Panel de Administracion:    http://127.0.0.1:8000/admin/
echo ========================================================
echo.
echo Abriendo Dashboard en el navegador...

timeout /t 3 >nul
start http://localhost:5173/


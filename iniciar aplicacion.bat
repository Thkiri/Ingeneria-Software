@echo off
title TecniMotor - Servidor de Desarrollo

echo ========================================================
echo          Iniciando Servidor TecniMotor
echo ========================================================
echo.

cd /d "%~dp0Backend"

if exist "..\.venv\Scripts\activate.bat" (
    echo Activando entorno virtual...
    call "..\.venv\Scripts\activate.bat"
) else if exist ".venv\Scripts\activate.bat" (
    echo Activando entorno virtual...
    call ".venv\Scripts\activate.bat"
)

echo.
echo ========================================================
echo   Panel de Administracion: http://127.0.0.1:8000/admin/
echo   Para detener el servidor: Presiona CTRL + C
echo ========================================================
echo.

start http://127.0.0.1:8000/admin/

python manage.py runserver

pause

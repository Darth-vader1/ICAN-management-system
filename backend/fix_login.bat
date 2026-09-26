@echo off
echo Running migrations for classroom app...
..\venv\Scripts\python.exe manage.py makemigrations classroom
..\venv\Scripts\python.exe manage.py migrate classroom

echo.
echo Installing missing dependencies...
..\venv\Scripts\python.exe -m pip install celery redis livekit

echo.
echo Migrations complete!
echo Please restart your Django server now.
pause

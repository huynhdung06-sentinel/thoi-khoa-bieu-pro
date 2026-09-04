@echo off
echo ===================================================
echo     Khoi dong he thong giao duc (Server + UI)
echo ===================================================

echo [1/2] Dang kiem tra va cai dat thu vien (npm install)...
call npm install

echo.
echo [2/2] Dang khoi dong server tai http://localhost:6060...
set APP_PORT=6060
call npm run dev

pause

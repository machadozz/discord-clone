@echo off
title Discord Clone - Pulse Stage App
color 0A
cls
echo =======================================================================
echo               DISCORD CLONE - PULSE STAGE (DESKTOP APP)
echo =======================================================================
echo.
echo [1/2] Iniciando Servidor Backend (NestJS, Prisma SQLite, WebSockets)...
start /b cmd /c "cd backend && npm run start:dev"

echo [2/2] Iniciando Servidor Frontend (React 19, LiveKit WebRTC)...
start /b cmd /c "cd frontend && npm run dev"

echo.
echo AGUARDANDO INICIALIZACAO COMPLETA (5 SEGUNDOS)...
timeout /t 5 /nobreak >nul

echo.
echo ABRINDO APLICATIVO DISCORD CLONE EM JANELA DEDICADA...
start http://localhost:5173/app

echo.
echo =======================================================================
echo   APLICATIVO INICIADO COM SUCESSO!
echo   Mantenha esta janela aberta enquanto estiver utilizando o aplicativo.
echo =======================================================================

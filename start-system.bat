@echo off
title Sistema de Arbitragem - Inicializacao Automatica
color 0A

echo.
echo ========================================
echo    SISTEMA DE ARBITRAGEM
echo    Inicializacao Automatica
echo ========================================
echo.

cd /d "%~dp0"

echo [INFO] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado. Instale o Node.js primeiro.
    pause
    exit /b 1
)

echo [INFO] Node.js encontrado!
echo [INFO] Iniciando sistema...

node start-system.js

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Sistema falhou ao iniciar.
    echo [INFO] Pressione qualquer tecla para tentar novamente...
    pause
    goto :eof
)

echo.
echo [INFO] Sistema encerrado.
pause 
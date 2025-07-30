@echo off
REM Script de Inicialização para Windows - Sistema de Arbitragem
REM Este script facilita a inicialização do sistema no Windows

echo ========================================
echo    SISTEMA DE ARBITRAGEM - WINDOWS
echo ========================================
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js encontrado: 
node --version

REM Verificar se estamos no diretório correto
if not exist "package.json" (
    echo ERRO: package.json nao encontrado!
    echo Certifique-se de estar no diretório correto do projeto.
    pause
    exit /b 1
)

echo.
echo Verificando configuracoes...

REM Verificar se .env existe
if not exist ".env" (
    echo Arquivo .env nao encontrado!
    echo Executando configuração inicial...
    node setup-initial-config.js
    if errorlevel 1 (
        echo ERRO: Falha na configuração inicial!
        pause
        exit /b 1
    )
)

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)

echo.
echo Iniciando sistema de arbitragem...
echo Pressione Ctrl+C para parar o sistema
echo.

REM Iniciar o sistema
node start-final-working.js

echo.
echo Sistema encerrado.
pause 
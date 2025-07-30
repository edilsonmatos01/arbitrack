# Script de Inicialização para Windows - Sistema de Arbitragem
# Este script PowerShell facilita a inicialização do sistema no Windows

param(
    [switch]$Setup,
    [switch]$Help
)

function Write-Header {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "    SISTEMA DE ARBITRAGEM - WINDOWS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Show-Help {
    Write-Host "Uso: .\start-windows.ps1 [opções]" -ForegroundColor White
    Write-Host ""
    Write-Host "Opções:" -ForegroundColor White
    Write-Host "  -Setup    Executar configuração inicial" -ForegroundColor White
    Write-Host "  -Help     Mostrar esta ajuda" -ForegroundColor White
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor White
    Write-Host "  .\start-windows.ps1              # Iniciar sistema" -ForegroundColor White
    Write-Host "  .\start-windows.ps1 -Setup       # Configuração inicial" -ForegroundColor White
    Write-Host "  .\start-windows.ps1 -Help        # Mostrar ajuda" -ForegroundColor White
}

function Test-NodeJS {
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Node.js encontrado: $nodeVersion"
            return $true
        } else {
            Write-Error "Node.js não encontrado!"
            Write-Host "Por favor, instale o Node.js em: https://nodejs.org/" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Error "Erro ao verificar Node.js: $($_.Exception.Message)"
        return $false
    }
}

function Test-ProjectStructure {
    $requiredFiles = @("package.json", "prisma/schema.prisma")
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-Error "Arquivo necessário não encontrado: $file"
            Write-Host "Certifique-se de estar no diretório correto do projeto." -ForegroundColor Yellow
            return $false
        }
    }
    
    Write-Success "Estrutura do projeto verificada"
    return $true
}

function Test-Environment {
    if (-not (Test-Path ".env")) {
        Write-Warning "Arquivo .env não encontrado!"
        
        if ($Setup) {
            Write-Host "Executando configuração inicial..." -ForegroundColor Yellow
            node setup-initial-config.js
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Falha na configuração inicial!"
                return $false
            }
        } else {
            Write-Host "Execute com -Setup para configurar o ambiente" -ForegroundColor Yellow
            return $false
        }
    } else {
        Write-Success "Arquivo .env encontrado"
    }
    
    return $true
}

function Install-Dependencies {
    if (-not (Test-Path "node_modules")) {
        Write-Host "Instalando dependências..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Falha ao instalar dependências!"
            return $false
        }
        Write-Success "Dependências instaladas"
    } else {
        Write-Success "Dependências já instaladas"
    }
    
    return $true
}

function Build-Project {
    Write-Host "Compilando projeto..." -ForegroundColor Yellow
    
    # Gerar cliente Prisma
    Write-Host "Gerando cliente Prisma..." -ForegroundColor Yellow
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao gerar cliente Prisma!"
        return $false
    }
    
    # Compilar worker
    Write-Host "Compilando worker..." -ForegroundColor Yellow
    npm run build:worker
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao compilar worker!"
        return $false
    }
    
    # Compilar aplicação web
    Write-Host "Compilando aplicação web..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao compilar aplicação web!"
        return $false
    }
    
    Write-Success "Projeto compilado com sucesso"
    return $true
}

function Start-System {
    Write-Host ""
    Write-Host "Iniciando sistema de arbitragem..." -ForegroundColor Cyan
    Write-Host "Pressione Ctrl+C para parar o sistema" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        node start-final-working.js
    } catch {
        Write-Error "Erro ao iniciar sistema: $($_.Exception.Message)"
        return $false
    }
    
    return $true
}

function Main {
    Write-Header
    
    if ($Help) {
        Show-Help
        return
    }
    
    # Verificações iniciais
    if (-not (Test-NodeJS)) {
        Read-Host "Pressione Enter para sair"
        return
    }
    
    if (-not (Test-ProjectStructure)) {
        Read-Host "Pressione Enter para sair"
        return
    }
    
    if (-not (Test-Environment)) {
        Read-Host "Pressione Enter para sair"
        return
    }
    
    if (-not (Install-Dependencies)) {
        Read-Host "Pressione Enter para sair"
        return
    }
    
    if (-not (Build-Project)) {
        Read-Host "Pressione Enter para sair"
        return
    }
    
    # Iniciar sistema
    Start-System
    
    Write-Host ""
    Write-Host "Sistema encerrado." -ForegroundColor Cyan
    Read-Host "Pressione Enter para sair"
}

# Executar função principal
Main 
# Teste Basico de Performance
$baseUrl = "http://localhost:10000"

Write-Host "=== TESTE DE PERFORMANCE BASICO ===" -ForegroundColor Green
Write-Host "Servidor: $baseUrl" -ForegroundColor Yellow
Write-Host "Data/Hora: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# Testar Health Check
Write-Host "Testando Health Check..." -ForegroundColor Cyan
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method GET -TimeoutSec 10 -UseBasicParsing
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    Write-Host "  Health Check: $($response.StatusCode) - ${duration}ms" -ForegroundColor Green
} catch {
    Write-Host "  Health Check: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Testar Init Data Simple
Write-Host "Testando Init Data Simple..." -ForegroundColor Cyan
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/init-data-simple" -Method GET -TimeoutSec 30 -UseBasicParsing
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    Write-Host "  Init Data Simple: $($response.StatusCode) - ${duration}ms" -ForegroundColor Green
} catch {
    Write-Host "  Init Data Simple: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Testar Spread History
Write-Host "Testando Spread History..." -ForegroundColor Cyan
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/spread-history" -Method GET -TimeoutSec 30 -UseBasicParsing
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    Write-Host "  Spread History: $($response.StatusCode) - ${duration}ms" -ForegroundColor Green
} catch {
    Write-Host "  Spread History: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Testar MEXC Balance
Write-Host "Testando MEXC Balance..." -ForegroundColor Cyan
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/mexc/wallet-balance" -Method GET -TimeoutSec 30 -UseBasicParsing
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    Write-Host "  MEXC Balance: $($response.StatusCode) - ${duration}ms" -ForegroundColor Green
} catch {
    Write-Host "  MEXC Balance: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Testar GateIO Balance
Write-Host "Testando GateIO Balance..." -ForegroundColor Cyan
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/gateio/wallet-balance" -Method GET -TimeoutSec 30 -UseBasicParsing
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    Write-Host "  GateIO Balance: $($response.StatusCode) - ${duration}ms" -ForegroundColor Green
} catch {
    Write-Host "  GateIO Balance: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Teste concluido em: $(Get-Date)" -ForegroundColor Green 
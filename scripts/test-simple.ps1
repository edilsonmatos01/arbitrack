# Teste Simples de Performance - APIs do Robo de Arbitragem
$baseUrl = "http://localhost:10000"

Write-Host "=== TESTE DE PERFORMANCE SIMPLES ===" -ForegroundColor Green
Write-Host "Servidor: $baseUrl" -ForegroundColor Yellow
Write-Host "Data/Hora: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# APIs principais para testar
$apis = @(
    "Health Check|/api/health",
    "Init Data Simple|/api/init-data-simple", 
    "Spread History|/api/spread-history",
    "Spread History 24h|/api/spread-history/24h",
    "All Arbitrage Data|/api/arbitrage/all-data",
    "Binance Balance|/api/binance/wallet-balance",
    "GateIO Balance|/api/gateio/wallet-balance",
    "MEXC Balance|/api/mexc/wallet-balance",
    "Trading Balance|/api/trading/balance",
    "Operation History|/api/operation-history"
)

$results = @()

foreach ($api in $apis) {
    $parts = $api -split "\|"
    $name = $parts[0]
    $endpoint = $parts[1]
    $url = "$baseUrl$endpoint"
    
    Write-Host "Testando: $name..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 30 -UseBasicParsing
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        Write-Host "  ✓ $($response.StatusCode) - ${duration}ms - $($response.Content.Length) bytes" -ForegroundColor Green
        
        $results += [PSCustomObject]@{
            API = $name
            Status = $response.StatusCode
            Duration = [math]::Round($duration, 2)
            Success = $true
            Size = $response.Content.Length
        }
    }
    catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        Write-Host "  ✗ ERRO - ${duration}ms - $($_.Exception.Message)" -ForegroundColor Red
        
        $results += [PSCustomObject]@{
            API = $name
            Status = 0
            Duration = [math]::Round($duration, 2)
            Success = $false
            Size = 0
        }
    }
    
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "=== RESUMO ===" -ForegroundColor Green

$totalTests = $results.Count
$successfulTests = ($results | Where-Object { $_.Success }).Count
$failedTests = $totalTests - $successfulTests
$avgDuration = ($results | Where-Object { $_.Success } | Measure-Object -Property Duration -Average).Average

Write-Host "Total: $totalTests | Sucessos: $successfulTests | Falhas: $failedTests" -ForegroundColor White
Write-Host "Tempo medio: $([math]::Round($avgDuration, 2))ms" -ForegroundColor Yellow

Write-Host ""
Write-Host "=== APIS MAIS LENTAS ===" -ForegroundColor Red
$slowApis = $results | Where-Object { $_.Success } | Sort-Object Duration -Descending | Select-Object -First 3
foreach ($api in $slowApis) {
    Write-Host "$($api.API): $($api.Duration)ms" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== APIS COM FALHA ===" -ForegroundColor Red
$failedApis = $results | Where-Object { -not $_.Success }
foreach ($api in $failedApis) {
    Write-Host "$($api.API): FALHOU" -ForegroundColor Red
}

Write-Host ""
Write-Host "Teste concluido em: $(Get-Date)" -ForegroundColor Green 
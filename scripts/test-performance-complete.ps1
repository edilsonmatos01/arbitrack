# Script de Teste de Performance Completo para APIs do Robô de Arbitragem
# Testa todas as APIs principais e mede performance

$baseUrl = "http://localhost:10000"
$results = @()

Write-Host "=== TESTE DE PERFORMANCE COMPLETO ===" -ForegroundColor Green
Write-Host "Servidor: $baseUrl" -ForegroundColor Yellow
Write-Host "Data/Hora: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# Função para testar uma API
function Test-API {
    param(
        [string]$name,
        [string]$endpoint,
        [int]$timeout = 30000
    )
    
    $url = "$baseUrl$endpoint"
    $startTime = Get-Date
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec ($timeout/1000) -UseBasicParsing
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        $result = [PSCustomObject]@{
            API = $name
            Endpoint = $endpoint
            Status = $response.StatusCode
            Duration = [math]::Round($duration, 2)
            Success = $true
            Error = $null
            Size = $response.Content.Length
        }
        
        Write-Host "✓ $name - $($response.StatusCode) - ${duration}ms - $($response.Content.Length) bytes" -ForegroundColor Green
    }
    catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        $result = [PSCustomObject]@{
            API = $name
            Endpoint = $endpoint
            Status = $_.Exception.Response.StatusCode.value__ ?? 0
            Duration = [math]::Round($duration, 2)
            Success = $false
            Error = $_.Exception.Message
            Size = 0
        }
        
        Write-Host "✗ $name - $($result.Status) - ${duration}ms - ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    return $result
}

# Lista de APIs para testar
$apis = @(
    @{ Name = "Health Check"; Endpoint = "/api/health" },
    @{ Name = "Init Data Simple"; Endpoint = "/api/init-data-simple" },
    @{ Name = "Spread History"; Endpoint = "/api/spread-history" },
    @{ Name = "Spread History 24h"; Endpoint = "/api/spread-history/24h" },
    @{ Name = "Spread History Optimized"; Endpoint = "/api/spread-history/optimized" },
    @{ Name = "All Arbitrage Data"; Endpoint = "/api/arbitrage/all-data" },
    @{ Name = "All Opportunities"; Endpoint = "/api/arbitrage/all-opportunities" },
    @{ Name = "Inter Exchange"; Endpoint = "/api/arbitrage/inter-exchange" },
    @{ Name = "Average Spread"; Endpoint = "/api/average-spread" },
    @{ Name = "Binance Balance"; Endpoint = "/api/binance/wallet-balance" },
    @{ Name = "Bitget Balance"; Endpoint = "/api/bitget/wallet-balance" },
    @{ Name = "Bybit Balance"; Endpoint = "/api/bybit/wallet-balance" },
    @{ Name = "GateIO Balance"; Endpoint = "/api/gateio/wallet-balance" },
    @{ Name = "MEXC Balance"; Endpoint = "/api/mexc/wallet-balance" },
    @{ Name = "Operation History"; Endpoint = "/api/operation-history" },
    @{ Name = "Positions"; Endpoint = "/api/positions" },
    @{ Name = "Max Spreads"; Endpoint = "/api/spreads/max" },
    @{ Name = "Config API Keys"; Endpoint = "/api/config/api-keys" },
    @{ Name = "Manual Balances"; Endpoint = "/api/config/manual-balances" }
)

Write-Host "Iniciando testes de performance..." -ForegroundColor Cyan
Write-Host ""

# Testar cada API
foreach ($api in $apis) {
    $result = Test-API -name $api.Name -endpoint $api.Endpoint
    $results += $result
    
    # Pequena pausa entre requests
    Start-Sleep -Milliseconds 100
}

Write-Host ""
Write-Host "=== RESUMO DOS RESULTADOS ===" -ForegroundColor Green

# Estatísticas gerais
$totalTests = $results.Count
$successfulTests = ($results | Where-Object { $_.Success }).Count
$failedTests = $totalTests - $successfulTests
$avgDuration = ($results | Where-Object { $_.Success } | Measure-Object -Property Duration -Average).Average

Write-Host "Total de APIs testadas: $totalTests" -ForegroundColor White
Write-Host "Sucessos: $successfulTests" -ForegroundColor Green
Write-Host "Falhas: $failedTests" -ForegroundColor Red
Write-Host "Taxa de sucesso: $([math]::Round(($successfulTests / $totalTests) * 100, 1))%" -ForegroundColor Yellow
Write-Host "Tempo médio de resposta: $([math]::Round($avgDuration, 2))ms" -ForegroundColor Yellow

Write-Host ""
Write-Host "=== APIS MAIS LENTAS ===" -ForegroundColor Red
$slowApis = $results | Where-Object { $_.Success } | Sort-Object Duration -Descending | Select-Object -First 5
foreach ($api in $slowApis) {
    Write-Host "$($api.API): $($api.Duration)ms" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== APIS COM FALHA ===" -ForegroundColor Red
$failedApis = $results | Where-Object { -not $_.Success }
foreach ($api in $failedApis) {
    Write-Host "$($api.API): $($api.Error)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== DETALHES COMPLETOS ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize

# Salvar resultados em arquivo
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "performance-test-$timestamp.log"
$results | ConvertTo-Json -Depth 3 | Out-File -FilePath $logFile -Encoding UTF8

Write-Host ""
Write-Host "Resultados salvos em: $logFile" -ForegroundColor Green

# Recomendações baseadas nos resultados
Write-Host ""
Write-Host "=== RECOMENDAÇÕES ===" -ForegroundColor Yellow

if ($avgDuration -gt 2000) {
    Write-Host "⚠️  Performance crítica detectada! Tempo médio > 2s" -ForegroundColor Red
    Write-Host "   - Aplicar índices no banco de dados URGENTEMENTE" -ForegroundColor Red
    Write-Host "   - Verificar consultas SQL otimizadas" -ForegroundColor Red
    Write-Host "   - Implementar cache mais agressivo" -ForegroundColor Red
}

if ($failedTests -gt 0) {
    Write-Host "⚠️  APIs com falha detectadas!" -ForegroundColor Red
    Write-Host "   - Verificar rotas das APIs" -ForegroundColor Red
    Write-Host "   - Verificar conectividade com banco" -ForegroundColor Red
    Write-Host "   - Verificar logs do servidor" -ForegroundColor Red
}

if ($successfulTests -eq $totalTests) {
    Write-Host "✅ Todas as APIs estão respondendo!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Teste concluído em: $(Get-Date)" -ForegroundColor Green 
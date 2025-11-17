# Test Runner Script for Protiddhoni Project (Windows PowerShell)
# Runs all unit tests and generates coverage reports

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Protiddhoni - Test Suite Execution" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Backend Tests
Write-Host "[1/2] Running Backend Tests..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
Set-Location backend

$backendTestResult = $?
npm test -- --coverage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend tests passed" -ForegroundColor Green
} else {
    Write-Host "✗ Backend tests failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..
Write-Host ""

# Frontend Tests
Write-Host "[2/2] Running Frontend Tests..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
Set-Location frontend\protiddhoni

npm test -- --coverage --watchAll=false

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Frontend tests passed" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend tests failed" -ForegroundColor Red
    Set-Location ..\..
    exit 1
}

Set-Location ..\..
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "All Tests Completed Successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Coverage reports generated:"
Write-Host "  - Backend: backend\coverage\"
Write-Host "  - Frontend: frontend\protiddhoni\coverage\"
Write-Host ""

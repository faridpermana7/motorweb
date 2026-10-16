# PowerShell script to deploy with admin check
# Right-click > Run with PowerShell OR double-click

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Motor Web - IIS Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$adminRole = [Security.Principal.WindowsBuiltInRole]::Administrator

if (-not $principal.IsInRole($adminRole)) {
    Write-Host "ERROR: This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please right-click this file and select:" -ForegroundColor Yellow
    Write-Host "  'Run with PowerShell' or open PowerShell as Admin and run:" -ForegroundColor Yellow
    Write-Host "  Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process" -ForegroundColor White
    Write-Host "  & '$PSScriptRoot\DEPLOY_AS_ADMIN.ps1'" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Change to project directory
Set-Location $PSScriptRoot

Write-Host "Running: npm run deploy" -ForegroundColor Green
Write-Host ""

# Run deployment
npm run deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Deployment failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "SUCCESS: Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is available at:" -ForegroundColor Cyan
Write-Host "  - https://motor.web:10000/" -ForegroundColor White
Write-Host "  - https://127.0.0.1/:10000/" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"

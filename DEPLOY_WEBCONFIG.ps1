# Requires running as Administrator
param([switch]$RunAsAdmin)

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script requires Administrator privileges." -ForegroundColor Red
    Write-Host "Right-click this script and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Copying web.config to IIS..." -ForegroundColor Cyan

try {
    # Stop IIS AppPool
    Write-Host "Stopping IIS AppPool 'motor'..." -ForegroundColor Yellow
    & "C:\Windows\System32\inetsrv\appcmd.exe" stop apppool /apppool.name:"motor" 2>$null
    Start-Sleep -Seconds 1

    # Copy web.config
    Copy-Item -Path 'd:\project\motorweb\web.config' -Destination 'C:\inetpub\wwwroot\motorweb\web.config' -Force
    Write-Host "✓ web.config copied successfully" -ForegroundColor Green

    # Verify
    $fileInfo = Get-Item 'C:\inetpub\wwwroot\motorweb\web.config'
    Write-Host "File size: $($fileInfo.Length) bytes" -ForegroundColor Cyan
    Write-Host "Modified: $($fileInfo.LastWriteTime)" -ForegroundColor Cyan

    # Start IIS AppPool
    Write-Host "Starting IIS AppPool 'motor'..." -ForegroundColor Yellow
    & "C:\Windows\System32\inetsrv\appcmd.exe" start apppool /apppool.name:"motor" 2>$null
    Start-Sleep -Seconds 1

    Write-Host "✓ Deployment complete!" -ForegroundColor Green
    Write-Host "Try accessing: https://motor.web:10000" -ForegroundColor Cyan
}
catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit 1
}

pause

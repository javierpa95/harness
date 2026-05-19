# [PROJECT_NAME] - Development Scripts
# Usage: .\scripts\dev.ps1 <command>
# Commands: up, down, logs, dev, build, restart, clean, help
# Adjust paths and commands to match your stack.

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent

function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-Ok { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Err { Write-Host "❌ $args" -ForegroundColor Red }

function Start-Dev {
    Write-Info "Starting dev server..."
    Set-Location "$ProjectRoot\apps\web"
    if (-not (Test-Path "node_modules")) {
        Write-Info "Installing dependencies..."
        npm install
    }
    npm run dev
}

function Docker-Up {
    Write-Info "Starting all services..."
    Set-Location $ProjectRoot
    docker compose up -d
    Write-Ok "Services started"
}

function Docker-Down {
    Write-Info "Stopping all services..."
    Set-Location $ProjectRoot
    docker compose down
    Write-Ok "Services stopped"
}

function Docker-Logs {
    Write-Info "Showing logs..."
    Set-Location $ProjectRoot
    docker compose logs -f --tail=50
}

function Docker-Restart {
    Write-Info "Restarting services..."
    Set-Location $ProjectRoot
    docker compose restart
    Write-Ok "Services restarted"
}

function Docker-Build {
    Write-Info "Building image..."
    Set-Location $ProjectRoot
    docker compose build
    Write-Ok "Build complete"
}

function Docker-Clean {
    Write-Info "Stopping and removing containers + volumes..."
    Set-Location $ProjectRoot
    docker compose down -v
    Write-Ok "Clean complete"
}

function Show-Help {
    Write-Host ""
    Write-Host "[PROJECT_NAME] - Development Scripts" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Usage: .\scripts\dev.ps1 <command>" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  up        Start all services (Docker)"
    Write-Host "  down      Stop all services"
    Write-Host "  logs      Show service logs"
    Write-Host "  restart   Restart all services"
    Write-Host "  build     Build Docker image"
    Write-Host "  clean     Stop + remove containers and volumes"
    Write-Host "  dev       Start dev server (no Docker)"
    Write-Host "  help      Show this help"
    Write-Host ""
}

switch ($Command) {
    "up"      { Docker-Up }
    "down"    { Docker-Down }
    "logs"    { Docker-Logs }
    "restart" { Docker-Restart }
    "build"   { Docker-Build }
    "clean"   { Docker-Clean }
    "dev"     { Start-Dev }
    "help"    { Show-Help }
    default   { Write-Err "Unknown command: $Command"; Show-Help; exit 1 }
}

# Dev-only database reset script
# NEVER runs in production/CI

param(
    [switch]$Force
)

$env = $env:NODE_ENV
if (-not $env) { $env = "development" }
$ci = $env:CI

if ($env -eq "production" -or $ci -eq "true") {
    Write-Error "❌ Refusing to reset DB in production/CI."
    Write-Error "   NODE_ENV: $env"
    Write-Error "   CI: $ci"
    exit 1
}

if (-not $Force) {
    Write-Warning "⚠️  This will DESTROY all local dev data!"
    Write-Warning "   Run with -Force to proceed"
    exit 1
}

Write-Output "[INFO] 🔄 Resetting local dev database..."
Write-Output "[INFO] Environment: $env"

try {
    Write-Output "[INFO] Running: npx prisma migrate reset --force"
    npx prisma migrate reset --force
    
    Write-Output "[INFO] 🌱 Seeding..."
    npx tsx prisma/seed.ts
    
    Write-Output "[INFO] ✅ Done."
} catch {
    Write-Error "[ERROR] Failed to reset database: $($_.Exception.Message)"
    exit 1
}

# Windows Development Setup Script for SpecimenStats (PowerShell)
# This script sets up the development environment on Windows

param(
    [switch]$Force
)

Write-Host "🚀 SpecimenStats Windows Development Setup" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Function to check if Docker Desktop is running
function Test-DockerDesktop {
    try {
        $dockerInfo = docker info 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
}

# Function to check Node.js version
function Test-NodeVersion {
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $version = $nodeVersion.TrimStart('v')
            $majorVersion = [int]($version.Split('.')[0])
            if ($majorVersion -ge 18) {
                Write-Host "✅ Node.js $version detected" -ForegroundColor Green
                return $true
            } else {
                Write-Host "⚠️  Node.js $version detected (requires 18+)" -ForegroundColor Yellow
                return $false
            }
        }
        return $false
    }
    catch {
        return $false
    }
}

# Function to generate secure random string
function New-SecureRandomString {
    $bytes = 1..32 | ForEach-Object { Get-Random -Maximum 256 }
    return [Convert]::ToBase64String($bytes)
}

# Check Docker Desktop
Write-Host "🔍 Checking Docker Desktop..." -ForegroundColor Yellow
if (-not (Test-DockerDesktop)) {
    Write-Host "❌ Docker Desktop is not running or not accessible" -ForegroundColor Red
    Write-Host "📋 Please ensure Docker Desktop is:" -ForegroundColor Yellow
    Write-Host "   1. Installed from https://www.docker.com/products/docker-desktop/" -ForegroundColor White
    Write-Host "   2. Running and accessible from PowerShell" -ForegroundColor White
    Write-Host "   3. WSL2 backend is enabled (Settings > General > Use WSL 2)" -ForegroundColor White
    Write-Host "   4. WSL integration is enabled (Settings > Resources > WSL Integration)" -ForegroundColor White
    Write-Host ""
    Write-Host "🔄 After starting Docker Desktop, run this script again" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Docker Desktop is running" -ForegroundColor Green

# Check Node.js
Write-Host "🔍 Checking Node.js..." -ForegroundColor Yellow
if (-not (Test-NodeVersion)) {
    Write-Host "❌ Node.js 18+ is required but not found" -ForegroundColor Red
    Write-Host "📋 Please install Node.js 18+ using one of these methods:" -ForegroundColor Yellow
    Write-Host "   1. nvm-windows (recommended): https://github.com/coreybutler/nvm-windows" -ForegroundColor White
    Write-Host "   2. Official installer: https://nodejs.org/" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 After installation, restart PowerShell and run this script again" -ForegroundColor Yellow
    exit 1
}

# Check if .env exists, create if missing
Write-Host "🔍 Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path "env.example") {
        Write-Host "📋 Creating .env from env.example..." -ForegroundColor Yellow
        Copy-Item "env.example" ".env"
        Write-Host "✅ .env file created" -ForegroundColor Green
    } else {
        Write-Host "❌ env.example not found" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

# Check and set NEXTAUTH_SECRET if missing
$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch "NEXTAUTH_SECRET=" -or $envContent -match "NEXTAUTH_SECRET=your-nextauth-secret-here") {
    Write-Host "🔐 Generating NEXTAUTH_SECRET..." -ForegroundColor Yellow
    $secret = New-SecureRandomString
    $secretLine = "NEXTAUTH_SECRET=`"$secret`""
    
    if ($envContent -match "NEXTAUTH_SECRET=") {
        # Replace existing line
        $envContent = $envContent -replace "NEXTAUTH_SECRET=.*", $secretLine
    } else {
        # Add new line
        $envContent += "`n$secretLine"
    }
    
    Set-Content ".env" $envContent
    Write-Host "✅ NEXTAUTH_SECRET generated and added to .env" -ForegroundColor Green
}

# Ensure DATABASE_URL is correct
Write-Host "🔍 Verifying database configuration..." -ForegroundColor Yellow
$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/specimenstats"') {
    Write-Host "🗄️ Setting correct DATABASE_URL..." -ForegroundColor Yellow
    if ($envContent -match 'DATABASE_URL=.*') {
        $envContent = $envContent -replace 'DATABASE_URL=.*', 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/specimenstats"'
    } else {
        $envContent += "`nDATABASE_URL=`"postgresql://postgres:postgres@localhost:5432/specimenstats`""
    }
    Set-Content ".env" $envContent
    Write-Host "✅ DATABASE_URL configured" -ForegroundColor Green
}

# Start database
Write-Host "🐳 Starting database container..." -ForegroundColor Yellow
docker compose up -d db
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start database container" -ForegroundColor Red
    Write-Host "💡 Try running: docker compose down && docker compose up -d db" -ForegroundColor Yellow
    exit 1
}

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
do {
    Start-Sleep -Seconds 2
    $attempt++
    $status = docker compose ps db 2>$null | Select-String "healthy"
    if ($status) {
        Write-Host "✅ Database is healthy" -ForegroundColor Green
        break
    }
    Write-Host "⏳ Attempt $attempt/$maxAttempts - Waiting for database..." -ForegroundColor Yellow
} while ($attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
    Write-Host "❌ Database failed to become healthy after $maxAttempts attempts" -ForegroundColor Red
    Write-Host "💡 Check database logs: docker compose logs db" -ForegroundColor Yellow
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Write-Host "🔒 Using package-lock.json for consistent installs..." -ForegroundColor Yellow
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  npm ci failed, falling back to npm install..." -ForegroundColor Yellow
        npm install
    }
} else {
    Write-Host "📦 No lockfile found, running npm install..." -ForegroundColor Yellow
    npm install
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Generate Prisma client
Write-Host "🗄️ Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma client generated" -ForegroundColor Green

# Run database migrations
Write-Host "🔄 Running database migrations..." -ForegroundColor Yellow
npx prisma migrate dev
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run database migrations" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database migrations completed" -ForegroundColor Green

# Seed database if seed script exists
if (Test-Path "prisma/seed.ts") {
    Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
    npx prisma db seed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database seeded" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database seeding failed (this is optional)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Start the development server:" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. Open your browser to:" -ForegroundColor White
Write-Host "      http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "   3. Complete Discord OAuth setup in your .env file:" -ForegroundColor White
Write-Host "      DISCORD_CLIENT_ID=your-discord-client-id" -ForegroundColor Cyan
Write-Host "      DISCORD_CLIENT_SECRET=your-discord-client-secret" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Useful commands:" -ForegroundColor Yellow
Write-Host "   - View logs: docker compose logs -f" -ForegroundColor White
Write-Host "   - Stop services: docker compose down" -ForegroundColor White
Write-Host "   - Database studio: npx prisma studio" -ForegroundColor White
Write-Host ""
Write-Host "🔧 If you encounter issues:" -ForegroundColor Yellow
Write-Host "   - Check Docker Desktop is running" -ForegroundColor White
Write-Host "   - Verify WSL2 backend is enabled" -ForegroundColor White
Write-Host "   - Restart PowerShell after Node.js installation" -ForegroundColor White

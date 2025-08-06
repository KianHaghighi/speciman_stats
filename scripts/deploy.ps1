# Production Deployment Script for SpecimenStats (PowerShell)
param(
    [switch]$Start
)

Write-Host "🚀 Starting production deployment..." -ForegroundColor Green

# Check if required environment variables are set
$requiredVars = @("NEXTAUTH_SECRET", "DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET", "DATABASE_URL", "NEXTAUTH_URL")
foreach ($var in $requiredVars) {
    if (-not (Test-Path "env:$var")) {
        Write-Host "❌ Error: $var environment variable is not set" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Environment variables validated" -ForegroundColor Green

# Build the application
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build

# Generate Prisma client
Write-Host "🗄️ Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Run database migrations
Write-Host "🔄 Running database migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

# Build Docker image
Write-Host "🐳 Building Docker image..." -ForegroundColor Yellow
docker build -t specimenstats:latest .

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🎉 Your application is ready for production" -ForegroundColor Green

# Optional: Start the application
if ($Start) {
    Write-Host "🚀 Starting application..." -ForegroundColor Yellow
    docker run -d `
        --name specimenstats `
        -p 3000:3000 `
        -e NEXTAUTH_SECRET="$env:NEXTAUTH_SECRET" `
        -e DISCORD_CLIENT_ID="$env:DISCORD_CLIENT_ID" `
        -e DISCORD_CLIENT_SECRET="$env:DISCORD_CLIENT_SECRET" `
        -e DATABASE_URL="$env:DATABASE_URL" `
        -e NEXTAUTH_URL="$env:NEXTAUTH_URL" `
        -e NODE_ENV=production `
        specimenstats:latest
    
    Write-Host "✅ Application started on http://localhost:3000" -ForegroundColor Green
} 
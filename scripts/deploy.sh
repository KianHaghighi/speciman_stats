#!/bin/bash

# Production Deployment Script for SpecimenStats
set -e

echo "🚀 Starting production deployment..."

# Check if required environment variables are set
required_vars=("NEXTAUTH_SECRET" "DISCORD_CLIENT_ID" "DISCORD_CLIENT_SECRET" "DATABASE_URL" "NEXTAUTH_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var environment variable is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Build the application
echo "📦 Building application..."
npm run build

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t specimenstats:latest .

echo "✅ Deployment completed successfully!"
echo "🎉 Your application is ready for production"

# Optional: Start the application
if [ "$1" = "--start" ]; then
    echo "🚀 Starting application..."
    docker run -d \
        --name specimenstats \
        -p 3000:3000 \
        -e NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
        -e DISCORD_CLIENT_ID="$DISCORD_CLIENT_ID" \
        -e DISCORD_CLIENT_SECRET="$DISCORD_CLIENT_SECRET" \
        -e DATABASE_URL="$DATABASE_URL" \
        -e NEXTAUTH_URL="$NEXTAUTH_URL" \
        -e NODE_ENV=production \
        specimenstats:latest
    
    echo "✅ Application started on http://localhost:3000"
fi 
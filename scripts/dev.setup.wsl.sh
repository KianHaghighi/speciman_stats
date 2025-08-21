#!/bin/bash

# WSL Ubuntu Development Setup Script for SpecimenStats
# This script sets up the development environment in WSL Ubuntu
# Assumes Docker Desktop WSL integration is enabled

set -e

echo "🚀 SpecimenStats WSL Ubuntu Development Setup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}🔍 $1${NC}"
}

# Check if running in WSL
if [[ ! -f /proc/version ]] || ! grep -qi microsoft /proc/version; then
    print_error "This script is designed for WSL Ubuntu. Please run it in WSL."
    exit 1
fi

print_info "WSL environment detected"

# Check if Docker is accessible
print_info "Checking Docker access..."
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not accessible from WSL"
    echo "Please ensure:"
    echo "1. Docker Desktop is running on Windows"
    echo "2. WSL integration is enabled in Docker Desktop settings"
    echo "3. This WSL distribution is enabled for Docker integration"
    echo ""
    echo "To enable WSL integration:"
    echo "Docker Desktop → Settings → Resources → WSL Integration → Enable for Ubuntu"
    exit 1
fi
print_status "Docker is accessible"

# Check if nvm is installed
print_info "Checking Node.js version manager..."
if ! command -v nvm >/dev/null 2>&1; then
    print_warning "nvm not found. Installing nvm..."
    
    # Install nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Source nvm in current shell
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    print_status "nvm installed"
else
    print_status "nvm found"
fi

# Source nvm if not already sourced
if ! command -v nvm >/dev/null 2>&1; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
fi

# Install and use Node.js 18
print_info "Installing Node.js 18..."
nvm install 18
nvm use 18
nvm alias default 18

# Verify Node.js version
NODE_VERSION=$(node --version)
print_status "Using Node.js $NODE_VERSION"

# Check if .env exists, create if missing
print_info "Checking environment configuration..."
if [[ ! -f .env ]]; then
    if [[ -f env.example ]]; then
        print_info "Creating .env from env.example..."
        cp env.example .env
        print_status ".env file created"
    else
        print_error "env.example not found"
        exit 1
    fi
else
    print_status ".env file exists"
fi

# Check and set NEXTAUTH_SECRET if missing
print_info "Checking NEXTAUTH_SECRET..."
if ! grep -q "NEXTAUTH_SECRET=" .env || grep -q "NEXTAUTH_SECRET=your-nextauth-secret-here" .env; then
    print_info "Generating NEXTAUTH_SECRET..."
    SECRET=$(openssl rand -base64 32)
    
    if grep -q "NEXTAUTH_SECRET=" .env; then
        # Replace existing line
        sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=\"$SECRET\"/" .env
    else
        # Add new line
        echo "NEXTAUTH_SECRET=\"$SECRET\"" >> .env
    fi
    
    print_status "NEXTAUTH_SECRET generated and added to .env"
fi

# Ensure DATABASE_URL is correct
print_info "Verifying database configuration..."
if ! grep -q 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/specimenstats"' .env; then
    print_info "Setting correct DATABASE_URL..."
    if grep -q "DATABASE_URL=" .env; then
        # Replace existing line
        sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:postgres@localhost:5432/specimenstats"|' .env
    else
        # Add new line
        echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/specimenstats"' >> .env
    fi
    print_status "DATABASE_URL configured"
fi

# Start database
print_info "Starting database container..."
docker compose up -d db

# Wait for database to be ready
print_info "Waiting for database to be ready..."
max_attempts=30
attempt=0
while [[ $attempt -lt $max_attempts ]]; do
    sleep 2
    attempt=$((attempt + 1))
    
    if docker compose ps db 2>/dev/null | grep -q "healthy"; then
        print_status "Database is healthy"
        break
    fi
    
    echo -e "${YELLOW}⏳ Attempt $attempt/$max_attempts - Waiting for database...${NC}"
done

if [[ $attempt -ge $max_attempts ]]; then
    print_error "Database failed to become healthy after $max_attempts attempts"
    echo "💡 Check database logs: docker compose logs db"
    exit 1
fi

# Install dependencies
print_info "Installing dependencies..."
if [[ -f package-lock.json ]]; then
    print_info "Using package-lock.json for consistent installs..."
    npm ci
    if [[ $? -ne 0 ]]; then
        print_warning "npm ci failed, falling back to npm install..."
        npm install
    fi
else
    print_info "No lockfile found, running npm install..."
    npm install
fi

if [[ $? -ne 0 ]]; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_status "Dependencies installed"

# Generate Prisma client
print_info "Generating Prisma client..."
npx prisma generate
if [[ $? -ne 0 ]]; then
    print_error "Failed to generate Prisma client"
    exit 1
fi
print_status "Prisma client generated"

# Run database migrations
print_info "Running database migrations..."
npx prisma migrate dev
if [[ $? -ne 0 ]]; then
    print_error "Failed to run database migrations"
    exit 1
fi
print_status "Database migrations completed"

# Seed database if seed script exists
if [[ -f prisma/seed.ts ]]; then
    print_info "Seeding database..."
    npx prisma db seed
    if [[ $? -eq 0 ]]; then
        print_status "Database seeded"
    else
        print_warning "Database seeding failed (this is optional)"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo "=============================================="
echo ""
echo -e "${YELLOW}🚀 Next steps:${NC}"
echo "   1. Start the development server:"
echo -e "      ${BLUE}npm run dev${NC}"
echo ""
echo "   2. Open your browser to:"
echo -e "      ${BLUE}http://localhost:3000${NC}"
echo ""
echo "   3. Complete Discord OAuth setup in your .env file:"
echo "      DISCORD_CLIENT_ID=your-discord-client-id"
echo "      DISCORD_CLIENT_SECRET=your-discord-client-secret"
echo ""
echo -e "${YELLOW}💡 Useful commands:${NC}"
echo "   - View logs: docker compose logs -f"
echo "   - Stop services: docker compose down"
echo "   - Database studio: npx prisma studio"
echo ""
echo -e "${YELLOW}🔧 If you encounter issues:${NC}"
echo "   - Check Docker Desktop is running on Windows"
echo "   - Verify WSL integration is enabled in Docker Desktop"
echo "   - Ensure this WSL distribution is enabled for Docker integration"
echo ""
echo -e "${YELLOW}📝 Note:${NC}"
echo "   This script assumes you're using WSL Ubuntu with Docker Desktop"
echo "   WSL integration enabled. If you encounter issues, check Docker"
echo "   Desktop settings and ensure WSL2 backend is enabled."

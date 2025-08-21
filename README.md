# SpecimenStats

A comprehensive fitness tracking platform that gamifies your workout journey with ELO ratings, social features, and detailed analytics. Track your progress, compete with friends, and climb the leaderboards across multiple fitness disciplines.

## 🚀 Features

### Core Tracking & Analytics
- 📊 **Multi-Class System** - Choose from 5 specialized fitness classes (Titan, Beast, Bodyweight Master, Hunter Gatherer, Super Athlete)
- 🎯 **ELO Rating System** - Dynamic skill ratings that adapt to your performance across metrics
- 📈 **Time-Series Analytics** - Detailed progress tracking with charts and percentile rankings
- 🏆 **Comprehensive Leaderboards** - Global, gym-based, and class-specific rankings
- 💪 **Muscle Group Analysis** - Visual body mapping with individual muscle ELO ratings

### Social & Competition
- 👥 **Friends System** - Send requests, manage friendships, and compare stats
- 🤝 **Side-by-Side Comparisons** - Detailed metric analysis between friends
- 🔔 **Real-time Notifications** - ELO changes, rank updates, friend requests
- 🏟️ **Gym Communities** - Local leaderboards and community features
- 🗺️ **Interactive Gym Map** - Find and join local gyms with integrated mapping

### User Experience
- 🎮 **App-Store Feel** - Modern, smooth interface with premium animations
- 🔊 **Sound Effects** - Audio feedback for achievements and rank changes
- ⚙️ **Customizable Settings** - Units (metric/imperial), sound preferences, language
- 🎨 **Enhanced Animations** - Confetti celebrations, rank change effects, smooth transitions
- 📱 **Mobile-First Design** - Responsive design optimized for all devices

### Developer & Operations
- 📝 **Structured Logging** - JSON logs with request IDs, user context, and comprehensive metadata
- 🧪 **Testing Suite** - Unit tests for ELO calculations, percentiles, and critical functions
- 🔍 **Dev Log Viewer** - Real-time log monitoring interface for development
- 🌱 **Rich Seed Data** - Comprehensive test data with time-series and relationships

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, tRPC, Prisma ORM
- **Database**: PostgreSQL with advanced querying and indexing
- **Authentication**: NextAuth.js with Discord OAuth
- **Sound System**: Web Audio API with user preference management
- **Testing**: Jest (unit), Cypress (E2E), React Testing Library
- **Deployment**: Docker with multi-stage builds and security optimizations
- **Logging**: Custom structured logging with request tracking

## 📋 Prerequisites

### Core Requirements
- **Node.js 18+** (LTS recommended)
- **Docker & Docker Compose** (latest stable)
- **PostgreSQL 13+** (or containerized)
- **Discord Application** (for OAuth)

### Development Tools
- **Git** for version control
- **VSCode** (recommended) with TypeScript extensions
- **Prisma Studio** for database management
- **Postman/Insomnia** for API testing

### Windows-Specific Setup
- **Docker Desktop** with WSL2 backend enabled
- **Windows Terminal** or **PowerShell Core 7+**
- **WSL2 Ubuntu** (optional but recommended)
- **nvm-windows** for Node.js version management

## 🔧 Environment Setup

### Quick Setup

Copy the example environment file and fill in your values:

```bash
# Linux/macOS/WSL
cp .env.example .env.local

# Windows PowerShell
copy .env.example .env.local
```

Then edit `.env.local` with your real values. **Never commit `.env*` files** - they're already gitignored.

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/specimenstats"
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="__FILL_ME__"
SESSION_MAX_AGE_SECONDS=900
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="__FILL_ME__"
SMTP_PASS="__FILL_ME__"
SMTP_FROM="__FILL_ME__"
ADMIN_EMAIL="__FILL_ME__"
NEXT_PUBLIC_APP_URL="http://localhost:3002"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="__FILL_ME__"
```

### Optional Environment Variables

```env
# System
NODE_ENV="development"
LOG_LEVEL="info"

# App Configuration
ELO_ROLLING_DAYS=180
WEIGHT_STRATEGY="equal"
SFX_ENABLED=true
SFX_DEFAULT_VOLUME=0.6
REDIS_URL="redis://localhost:6379"
DISCORD_WEBHOOK_URL=""

# OAuth (optional if using credentials login)
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
APPLE_CLIENT_ID=""
APPLE_TEAM_ID=""
APPLE_KEY_ID=""
APPLE_PRIVATE_KEY=""
```

### 🔑 Setting up Discord OAuth

1. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application" and give it a name
   - Save the Application ID as your `DISCORD_CLIENT_ID`

2. **Configure OAuth2**
   - Navigate to OAuth2 → General
   - Copy the Client Secret as your `DISCORD_CLIENT_SECRET`
   - Add redirect URI: `http://localhost:3000/api/auth/callback/discord`
   - For production: `https://yourdomain.com/api/auth/callback/discord`

3. **Set Bot Permissions** (Optional)
   - Go to Bot section if you plan to integrate Discord features
   - Enable necessary permissions for your use case

### 🗺️ Maps Setup (Optional)

**For Gym Location Features:**

**Option A: Mapbox (Recommended)**
1. Create account at [Mapbox](https://mapbox.com)
2. Generate an access token
3. Add as `NEXT_PUBLIC_MAPBOX_TOKEN`

**Option B: Google Maps**
1. Enable Google Maps JavaScript API in Google Cloud Console
2. Create API key with appropriate restrictions
3. Add as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### 📧 SMTP Configuration (Optional)

**For Email Notifications:**

**Gmail Setup:**
1. Enable 2-factor authentication
2. Generate an App Password
3. Use Gmail SMTP settings above

**Other Providers:**
- **SendGrid**: Use their SMTP relay
- **Mailgun**: Configure SMTP settings
- **AWS SES**: Set up SMTP credentials

## Quick Start

### Windows Quickstart

**Option A – PowerShell (native Windows)**
1. Install Docker Desktop and enable WSL2 backend (recommended).
2. Install Node 18 (nvm-windows recommended).
3. In PowerShell (as user):
   ```powershell
   ./scripts/dev.setup.windows.ps1
   npm run dev
   ```
   
   **Alternative:** Double-click `scripts/dev.setup.windows.bat` for easy execution.

**Option B – WSL (Ubuntu)**
1. Enable WSL + Ubuntu, enable Docker Desktop → Settings → Resources → WSL Integration.
2. In Ubuntu terminal:
   ```bash
   bash scripts/dev.setup.wsl.sh
   npm run dev
   ```

### Development (macOS/Linux)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd specimenstats
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production with Docker

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Set environment variables for production**
   ```bash
   export NEXTAUTH_SECRET="your-production-secret"
   export DISCORD_CLIENT_ID="your-discord-client-id"
   export DISCORD_CLIENT_SECRET="your-discord-client-secret"
   export NEXTAUTH_URL="https://your-domain.com"
   ```

3. **Access the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses the following main entities:

- **Users**: User profiles with authentication and fitness data
- **Metrics**: Custom fitness metrics (e.g., bench press, squat)
- **Entries**: Individual metric entries with values and timestamps
- **Accounts**: OAuth account connections
- **Sessions**: User session management

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/auth/*` - NextAuth.js authentication routes
- `POST /api/trpc/*` - tRPC API endpoints

## 📜 Available Scripts

### Core Development
```bash
npm run dev              # Start development server (port 3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint with auto-fix
npm run type-check       # TypeScript type checking
```

### Database Management
```bash
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with rich test data
npm run db:studio        # Open Prisma Studio (database GUI)
npm run db:reset:dev     # Safe dev reset (Linux/macOS)
npm run db:reset:dev:win # Safe dev reset (Windows)
```

### Testing
```bash
npm run test             # Run Jest unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run e2e              # Run Cypress E2E tests
npm run e2e:open         # Open Cypress interactive mode
```

### Development Tools
```bash
npm run logs:dev         # View development logs
npm run analyze          # Bundle analyzer
npm run format           # Format code with Prettier
```

### Windows-Specific Scripts
```powershell
# PowerShell scripts
./scripts/dev.setup.windows.ps1    # Complete dev environment setup
./scripts/dev.db.reset.ps1          # Database reset utility

# Batch files (double-click to run)
./scripts/dev.setup.windows.bat     # Easy setup launcher
```

### WSL/Linux Scripts
```bash
# WSL Ubuntu development
bash scripts/dev.setup.wsl.sh       # Complete dev environment setup
bash scripts/dev.db.reset.mjs       # Database reset utility
```

## Dev Reset (Safe)

This section provides safe database reset commands for local development. **These commands will NEVER run in production/CI environments.**

### Quick Dev Reset

**Windows (PowerShell):**
```powershell
npm run db:reset:dev:win
```

**macOS/Linux:**
```bash
npm run db:reset:dev
```

**Manual Reset (if you prefer to keep data):**
```bash
npx prisma migrate dev
npx prisma db seed
```

### What Dev Reset Does

1. **Drops local dev database** (only in development)
2. **Applies fresh migration** (`classes_five_and_geo`)
3. **Seeds with 5-class system**:
   - The Titan (Bodybuilding/Aesthetics)
   - The Beast (Strongman/Powerlifting) 
   - The Body Weight Master (Calisthenics/Gymnastics)
   - The Hunter Gatherer (Endurance/Running)
   - The Super Athlete (Sprints/Explosive)
4. **Creates sample gyms** with real coordinates
5. **Maps existing metrics** to appropriate classes
6. **Generates 300+ fake users** for meaningful percentiles

### Safety Guards

- ✅ **Production Blocked**: Refuses to run if `NODE_ENV=production`
- ✅ **CI Blocked**: Refuses to run if `CI=true`
- ✅ **Environment Check**: Logs current environment before proceeding
- ✅ **Error Handling**: Graceful failure with clear error messages

### After Reset

```bash
npm run dev
# Open http://localhost:3000
```

## 🌱 Rich Seed Data

The seeding system creates comprehensive test data for realistic development and testing:

### Seed Data Includes

**Users & Authentication:**
- 6 test users across all fitness classes
- Complete profiles with realistic data
- Pre-established friendships and social connections
- Admin user: `admin@specimenstats.com`
- Test user: `test@specimenstats.com`

**Gym Network:**
- 8 real gyms with accurate coordinates (LA area)
- Gold's Gym Venice, Equinox West Hollywood, etc.
- Ready for map integration testing

**Metrics & Classes:**
- 5-class system with specialized metrics per class
- **Titan**: Bench Press, Deadlift, Squat (strength focus)
- **Beast**: Power Clean, Snatch (explosive power)
- **Bodyweight Master**: Pull-ups, Push-ups, Handstand Hold
- **Hunter Gatherer**: 5K Run, Marathon (endurance)
- **Super Athlete**: Vertical Jump, 40-Yard Dash (speed/agility)

**Time-Series Data:**
- 30-90 days of historical entries per user
- Realistic progression patterns with noise
- ELO-appropriate performance levels
- Progressive improvement over time

**Social Features:**
- Established friendships between users
- Pending friend requests for testing
- Rich notification history
- Cross-class comparisons available

### Test User Credentials

```bash
# Admin user (full access)
admin@specimenstats.com

# Primary test user
test@specimenstats.com

# Additional test users
alice@specimenstats.com  # Bodyweight Master
bob@specimenstats.com    # Hunter Gatherer  
charlie@specimenstats.com # Super Athlete
diana@specimenstats.com  # Titan (high ELO)
```

**Note:** Real authentication requires Discord OAuth setup.

## ⚠️ Important: No User Metrics

**This system does not track actual user metrics or personal data.** 

- All fitness data is **user-entered** and **self-reported**
- No biometric sensors or tracking devices
- No health data collection or storage
- Users manually enter their workout results
- Focus is on **gamification** and **social comparison**
- **Privacy-first approach** - users control all data

## 🚀 Production Runbook

### Deployment Checklist

**Pre-Deployment:**
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates valid
- [ ] Discord OAuth URLs updated
- [ ] Health checks passing
- [ ] Backup strategy confirmed

**Environment Variables (Production):**
```env
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=secure-secret-min-32-chars
DISCORD_CLIENT_ID=prod-client-id
DISCORD_CLIENT_SECRET=prod-client-secret
LOG_LEVEL=info
STRUCTURED_LOGS=true
```

**Docker Production:**
```bash
# Build production image
docker build -t specimenstats:latest .

# Run with environment file
docker run -d \
  --name specimenstats \
  --env-file .env.production \
  -p 3000:3000 \
  specimenstats:latest
```

### Health Monitoring

**Health Check Endpoint:**
```bash
curl https://yourdomain.com/api/health
# Returns: {"status": "ok", "timestamp": "2024-..."}
```

**Log Monitoring:**
- Structured JSON logs with request IDs
- Error tracking with stack traces
- Performance metrics logging
- User action audit trails

**Key Metrics to Monitor:**
- Response times (< 500ms target)
- Database connection pool
- Memory usage (< 80% threshold)
- ELO calculation performance
- Friend request/notification queues

### Database Maintenance

**Regular Tasks:**
```bash
# Vacuum and analyze (weekly)
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Index maintenance
psql $DATABASE_URL -c "REINDEX DATABASE specimenstats;"

# Cleanup old notifications (monthly)
psql $DATABASE_URL -c "DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '90 days';"
```

**Backup Strategy:**
```bash
# Daily automated backups
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz

# Verify backup integrity
gunzip -c backup-$(date +%Y%m%d).sql.gz | head -n 10
```

### Scaling Considerations

**Performance Optimization:**
- Database indexing on user_id, metric_id, created_at
- ELO calculation caching for frequently accessed data
- Friend comparison result caching
- CDN for static assets and images

**Horizontal Scaling:**
- Stateless application design
- Database connection pooling
- Redis for session storage (if needed)
- Load balancer configuration

## Production Deployment

### Docker Deployment

1. **Build the image**
   ```bash
   docker build -t specimenstats .
   ```

2. **Run with environment variables**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="your-database-url" \
     -e NEXTAUTH_SECRET="your-secret" \
     -e DISCORD_CLIENT_ID="your-client-id" \
     -e DISCORD_CLIENT_SECRET="your-client-secret" \
     specimenstats
   ```

### Environment Variables for Production

- `NODE_ENV=production`
- `NEXTAUTH_URL=https://your-domain.com`
- `DATABASE_URL=your-production-database-url`
- `NEXTAUTH_SECRET=your-secure-secret`
- `DISCORD_CLIENT_ID=your-discord-client-id`
- `DISCORD_CLIENT_SECRET=your-discord-client-secret`

## Security Features

- HTTPS enforcement in production
- Secure cookie settings
- CSRF protection
- XSS protection headers
- Content Security Policy
- Non-root Docker user
- Environment variable validation

## Monitoring and Logging

The application includes comprehensive logging:

- Authentication events
- Database operations
- API request tracking
- Error logging with stack traces
- Performance metrics

## 🧪 Testing

### Unit Tests
```bash
npm run test              # Run all unit tests
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report
```

**Test Coverage:**
- ELO calculation algorithms
- Percentile ranking functions
- Muscle ELO computations
- Rank mapping logic
- User preference management
- Sound effects system

### E2E Tests
```bash
npm run e2e               # Run Cypress tests headlessly
npm run e2e:open          # Interactive Cypress GUI
```

**E2E Test Flows:**
- Complete friend request workflow
- Video review and rejection with notes
- Leaderboard navigation and search
- Gym selection on map
- Notification management

### Test Data

All tests use isolated test data and mocked services:
- No real database connections in unit tests
- Seeded test data for E2E scenarios
- Mocked external APIs (Discord, Maps)
- Controlled test environment

## 🤝 Contributing

### Development Workflow

1. **Fork & Clone**
   ```bash
   git clone your-fork-url
   cd specimenstats
   npm install
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Development Setup**
   ```bash
   cp env.example .env
   # Configure your .env file
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

4. **Code Quality**
   ```bash
   npm run lint              # ESLint checks
   npm run type-check        # TypeScript validation
   npm run test              # Unit tests
   npm run e2e               # E2E tests
   ```

5. **Submit PR**
   - Ensure all tests pass
   - Include test coverage for new features
   - Update documentation if needed
   - Follow conventional commit messages

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Standard commit message format
- **Test Coverage**: Minimum 80% for new features

### Architecture Guidelines

- **Component Structure**: Atomic design principles
- **State Management**: React hooks with context for global state
- **API Design**: RESTful endpoints with tRPC for type safety
- **Database**: Prisma ORM with proper indexing
- **Security**: Input validation, authentication checks, CSRF protection

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support & Community

### Getting Help

- **Documentation**: Comprehensive guides in this README
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues) for bugs and feature requests
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions) for general questions

### Reporting Issues

When reporting bugs, please include:
- Environment details (OS, Node version, browser)
- Steps to reproduce
- Expected vs actual behavior
- Console logs and error messages
- Screenshots if relevant

### Feature Requests

For new feature requests:
- Check existing issues/discussions first
- Provide clear use case and motivation
- Include mockups or detailed descriptions
- Consider implementation complexity

---

**Built with ❤️ by the SpecimenStats Team**

*Gamifying fitness, one rep at a time.* 🏋️‍♀️💪🎮 
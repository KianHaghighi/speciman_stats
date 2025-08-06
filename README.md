# SpecimenStats

A modern fitness tracking application that allows users to track their progress, compete with friends, and achieve their fitness goals. Built with Next.js, TypeScript, Prisma, and NextAuth.js.

## Features

- 🔐 **Secure Authentication** - Discord OAuth integration
- 📊 **Progress Tracking** - Custom metrics and personal records
- 🏆 **Leaderboards** - Compete with friends and community
- 🎯 **Goal Setting** - Set and track fitness objectives
- 📱 **Responsive Design** - Works on desktop and mobile
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 🔄 **Real-time Updates** - Live data synchronization

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, tRPC, Prisma
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with Discord OAuth
- **Deployment**: Docker, Docker Compose
- **Styling**: Tailwind CSS, Framer Motion

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL database
- Discord OAuth application

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/specimenstats"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# Discord OAuth
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# Environment
NODE_ENV="development"

# Optional: Logging
LOG_LEVEL="info"
```

### Setting up Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 settings
4. Add redirect URI: `http://localhost:3000/api/auth/callback/discord`
5. Copy Client ID and Client Secret to your `.env` file

## Quick Start

### Development

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

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with initial data

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team. 
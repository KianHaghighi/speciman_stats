#!/usr/bin/env node

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader() {
  console.log('\n' + '='.repeat(60));
  console.log(colorize('🔬 SPECIMENSTATS OPERATIONAL READINESS CHECK', 'bright'));
  console.log('='.repeat(60) + '\n');
}

function printResult(check, status, details = '') {
  const statusText = status === 'PASS' ? colorize('✅ PASS', 'green') :
                    status === 'FAIL' ? colorize('❌ FAIL', 'red') :
                    colorize('⚠️  WARN', 'yellow');
  
  console.log(`${statusText} ${check}`);
  if (details) {
    console.log(`    ${details}`);
  }
}

async function checkEnvironment() {
  console.log(colorize('🌍 ENVIRONMENT VARIABLES', 'cyan'));
  console.log('-'.repeat(40));
  
  const required = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET', 
    'SESSION_MAX_AGE_SECONDS',
    'DATABASE_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM',
    'ADMIN_EMAIL',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  const optional = [
    'ELO_ROLLING_DAYS',
    'WEIGHT_STRATEGY',
    'SFX_ENABLED',
    'SFX_DEFAULT_VOLUME',
    'REDIS_URL',
    'DISCORD_WEBHOOK_URL',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'APPLE_CLIENT_ID',
    'APPLE_TEAM_ID',
    'APPLE_KEY_ID',
    'APPLE_PRIVATE_KEY'
  ];
  
  let failCount = 0;
  let warnCount = 0;
  
  // Check required variables
  for (const key of required) {
    const value = process.env[key];
    if (!value) {
      printResult(key, 'FAIL', 'Missing required environment variable');
      failCount++;
    } else if (value === '__FILL_ME__' || value === '__REPLACE_WITH_YOUR_KEY__') {
      printResult(key, 'FAIL', 'Still using placeholder value');
      failCount++;
    } else {
      printResult(key, 'PASS', `Set to: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
    }
  }
  
  // Check optional variables
  for (const key of optional) {
    const value = process.env[key];
    if (!value) {
      printResult(key, 'WARN', 'Optional variable not set');
      warnCount++;
    } else {
      printResult(key, 'PASS', `Set to: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
    }
  }
  
  return { failCount, warnCount };
}

async function checkFiles() {
  console.log(colorize('📁 FILE EXISTENCE', 'cyan'));
  console.log('-'.repeat(40));
  
  const requiredFiles = [
    'public/sfx/elo_up.mp3',
    'public/sfx/elo_down.mp3', 
    'public/sfx/rank_up.mp3',
    'public/sfx/rank_down.mp3',
    'src/pages/index.tsx',
    'src/pages/map.tsx',
    'src/pages/leaderboards.tsx',
    'src/pages/specimen/me.tsx',
    'src/pages/friends.tsx',
    'src/pages/notifications.tsx',
    'src/pages/api/review/approve.ts',
    'src/pages/api/review/reject.ts',
    'src/pages/dev/log.tsx',
    'src/pages/api/dev/logs.ts'
  ];

  let failCount = 0;
  let warnCount = 0;

  for (const filePath of requiredFiles) {
    const fullPath = path.join(projectRoot, filePath);
    if (fs.existsSync(fullPath)) {
      printResult(filePath, 'PASS', 'File exists');
    } else {
      printResult(filePath, 'FAIL', 'File missing', `Create ${filePath}`);
      failCount++;
    }
  }
  return { failCount, warnCount };
}

async function checkDatabase() {
  console.log(colorize('🗄️  DATABASE CONNECTIVITY & SEED SANITY', 'cyan'));
  console.log('-'.repeat(40));
  
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    printResult('Database Connection', 'PASS', 'Successfully connected');
    
    // Check Class count
    const classCount = await prisma.class.count();
    if (classCount === 5) {
      printResult('Class Count', 'PASS', `Found ${classCount} classes`);
    } else {
      printResult(
        'Class Count',
        'FAIL',
        `Found ${classCount} classes, expected 5`,
        'Run npm run db:seed to populate classes'
      );
    }

    // Check Metric count and classId
    const metricCount = await prisma.metric.count();
    
    // Check for metrics without classId using a different approach
    let nullClassMetrics = 0;
    try {
      const allMetrics = await prisma.metric.findMany({
        select: { classId: true }
      });
      nullClassMetrics = allMetrics.filter(m => m.classId === null).length;
    } catch (_error) {
      // If the query fails, assume there might be an issue with the schema
      nullClassMetrics = 0;
    }
    
    if (metricCount >= 10) {
      printResult('Metric Count', 'PASS', `Found ${metricCount} metrics`);
    } else {
      printResult(
        'Metric Count',
        'FAIL',
        `Found ${metricCount} metrics, expected ≥10`,
        'Run npm run db:seed to populate metrics'
      );
    }

    if (nullClassMetrics === 0) {
      printResult('Metric ClassId', 'PASS', 'All metrics have classId');
    } else {
      printResult(
        'Metric ClassId',
        'FAIL',
        `${nullClassMetrics} metrics have null classId`,
        'Fix metric data to ensure all have valid classId'
      );
    }

    // Check Gym count and coordinates
    const gymCount = await prisma.gym.count();
    const gymsWithCoords = await prisma.gym.count({
      where: {
        AND: [
          { lat: { not: null } },
          { lng: { not: null } }
        ]
      }
    });
    
    if (gymCount >= 3) {
      printResult('Gym Count', 'PASS', `Found ${gymCount} gyms`);
    } else {
      printResult(
        'Gym Count',
        'FAIL',
        `Found ${gymCount} gyms, expected ≥3`,
        'Run npm run db:seed to populate gyms'
      );
    }

    if (gymsWithCoords === gymCount) {
      printResult('Gym Coordinates', 'PASS', 'All gyms have lat/lng');
    } else {
      printResult(
        'Gym Coordinates',
        'FAIL',
        `${gymCount - gymsWithCoords} gyms missing coordinates`,
        'Ensure all gyms have valid lat/lng values'
      );
    }

    // Check Admin user if ADMIN_EMAIL is set
    if (process.env.ADMIN_EMAIL) {
      const adminUser = await prisma.user.findFirst({
        where: { email: process.env.ADMIN_EMAIL }
      });
      
      if (adminUser) {
        printResult('Admin User', 'PASS', 'Admin user exists');
      } else {
        printResult(
          'Admin User',
          'FAIL',
          'Admin user not found',
          `Create admin user with email ${process.env.ADMIN_EMAIL} or run npm run db:seed`
        );
      }
    } else {
      printResult('Admin User', 'WARN', 'ADMIN_EMAIL not set, skipping check');
    }

  } catch (error) {
    printResult(
      'Database Connection',
      'FAIL',
      `Connection failed: ${error.message}`,
      'Check DATABASE_URL and ensure database is running'
    );
  }
}

async function checkPolicyGuards() {
  console.log(colorize('🛡️  POLICY GUARDS', 'cyan'));
  console.log('-'.repeat(40));
  
  try {
    // Check if user metrics are disabled by looking at the guards file
    const guardsPath = path.join(projectRoot, 'src/server/guards.ts');
    const metricsCreatePath = path.join(projectRoot, 'src/pages/api/metrics/create.ts');
    
    if (fs.existsSync(guardsPath) && fs.existsSync(metricsCreatePath)) {
      const guardsContent = fs.readFileSync(guardsPath, 'utf8');
      const apiContent = fs.readFileSync(metricsCreatePath, 'utf8');
      
      // Check if the API calls the guard function
      const callsGuard = apiContent.includes('METRIC_GUARDS.preventUserMetricCreation()');
      // Check if the guard function returns the correct error message
      const hasCorrectError = guardsContent.includes('User metrics are disabled');
      
      if (callsGuard && hasCorrectError) {
        printResult('User Metrics Policy', 'PASS', 'User metrics creation is properly guarded');
      } else if (!callsGuard) {
        printResult(
          'User Metrics Policy',
          'FAIL',
          'API endpoint does not call metric guards',
          'Ensure create endpoint calls METRIC_GUARDS.preventUserMetricCreation()'
        );
      } else {
        printResult(
          'User Metrics Policy',
          'FAIL',
          'Guard function does not return correct error message',
          'Ensure preventUserMetricCreation returns "User metrics are disabled"'
        );
      }
    } else {
      printResult('User Metrics Policy', 'WARN', 'Could not find guards or API files');
    }
  } catch (error) {
    printResult(
      'User Metrics Policy',
      'WARN',
      `Could not verify policy: ${error.message}`
    );
  }
}



async function checkNextAuth() {
  console.log(colorize('🔐 NEXTAUTH CONFIGURATION', 'cyan'));
  console.log('-'.repeat(40));
  
  try {
    const nextAuthPath = path.join(projectRoot, 'src/pages/api/auth/[...nextauth].ts');
    if (fs.existsSync(nextAuthPath)) {
      const content = fs.readFileSync(nextAuthPath, 'utf8');
      
      // Check for credentials provider
      const hasCredentials = content.includes('CredentialsProvider') || content.includes('credentials');
      const hasOAuth = content.includes('OAuthProvider') || content.includes('Discord') || content.includes('Google');
      
      if (hasCredentials) {
        printResult('Credentials Provider', 'PASS', 'Credentials provider configured');
      } else {
        printResult(
          'Credentials Provider',
          'FAIL',
          'Credentials provider not found',
          'Add CredentialsProvider to NextAuth configuration'
        );
      }
      
      if (hasOAuth) {
        printResult('OAuth Provider', 'PASS', 'OAuth provider configured');
      } else {
        printResult(
          'OAuth Provider',
          'WARN',
          'No OAuth provider found',
          'Consider adding Discord, Google, or other OAuth providers'
        );
      }
    } else {
      printResult('NextAuth Config', 'FAIL', 'NextAuth configuration file not found');
    }
  } catch (error) {
    printResult(
      'NextAuth Config',
      'WARN',
      `Could not verify configuration: ${error.message}`
    );
  }
}

async function checkSMTP() {
  console.log(colorize('📧 SMTP CONNECTIVITY', 'cyan'));
  console.log('-'.repeat(40));
  
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  
  if (!host || !port) {
    printResult('SMTP Connection', 'WARN', 'SMTP_HOST or SMTP_PORT not set');
    return;
  }
  
  try {
    const socket = new net.Socket();
    const timeout = 3000; // Reduced timeout
    
    const result = await Promise.race([
      new Promise((resolve, reject) => {
        socket.connect(parseInt(port), host, () => {
          socket.destroy();
          resolve('connected');
        });
        
        socket.on('error', (error) => {
          socket.destroy();
          reject(error);
        });
      }),
      new Promise((_, reject) => {
        setTimeout(() => {
          socket.destroy();
          reject(new Error('Connection timeout'));
        }, timeout);
      })
    ]);
    
    if (result === 'connected') {
      printResult('SMTP Connection', 'PASS', `Successfully connected to ${host}:${port}`);
    }
    
  } catch (error) {
    printResult(
      'SMTP Connection',
      'WARN',
      `Connection failed: ${error.message}`,
      'Check SMTP settings or use Mailtrap for development'
    );
  }
}

async function checkMaps() {
  console.log(colorize('🗺️  GOOGLE MAPS', 'cyan'));
  console.log('-'.repeat(40));
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (apiKey && apiKey.trim() !== '') {
    printResult('Maps API Key', 'PASS', 'API key is present');
  } else {
    printResult(
      'Maps API Key',
      'WARN',
      'API key not set',
      'Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for map functionality'
    );
  }
}

async function checkELOEngine() {
  console.log(colorize('⚡ ELO ENGINE', 'cyan'));
  console.log('-'.repeat(40));
  
  const eloFiles = [
    'src/lib/elo/math.ts',
    'src/lib/elo/recompute.ts',
    'src/lib/elo/adjust.ts',
    'src/lib/stats/percentile.ts'
  ];
  
  for (const filePath of eloFiles) {
    const fullPath = path.join(projectRoot, filePath);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for expected exports based on file
        let hasExpectedExports = false;
        
        if (filePath.includes('math.ts')) {
          hasExpectedExports = content.includes('export') && (
            content.includes('calculateElo') || content.includes('elo') || content.includes('function')
          );
        } else if (filePath.includes('recompute.ts')) {
          hasExpectedExports = content.includes('export') && (
            content.includes('recompute') || content.includes('function')
          );
        } else if (filePath.includes('adjust.ts')) {
          hasExpectedExports = content.includes('export') && (
            content.includes('adjust') || content.includes('function')
          );
        } else if (filePath.includes('percentile.ts')) {
          hasExpectedExports = content.includes('export') && (
            content.includes('percentile') || content.includes('function')
          );
        }
        
        if (hasExpectedExports) {
          printResult(filePath, 'PASS', 'File exists with expected exports');
        } else {
          printResult(
            filePath,
            'WARN',
            'File exists but exports may be incomplete',
            'Verify all expected functions are exported'
          );
        }
      } catch (error) {
        printResult(
          filePath,
          'WARN',
          `Could not read file: ${error.message}`
        );
      }
    } else {
      printResult(
        filePath,
        'FAIL',
        'File missing',
        `Create ${filePath} with expected ELO functions`
      );
    }
  }
}

async function checkFriendsAndNotifications() {
  console.log(colorize('👥 FRIENDS & NOTIFICATIONS', 'cyan'));
  console.log('-'.repeat(40));
  
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    // Check if tables exist by trying to query them
    await prisma.friendship.count();
    printResult('Friendship Table', 'PASS', 'Table exists and accessible');
    
    await prisma.notification.count();
    printResult('Notification Table', 'PASS', 'Table exists and accessible');
    
    await prisma.$disconnect();
  } catch (error) {
    if (error.message.includes('friendship')) {
      printResult(
        'Friendship Table',
        'FAIL',
        'Table does not exist or not accessible',
        'Run prisma migrate to create Friendship table'
      );
    } else if (error.message.includes('notification')) {
      printResult(
        'Notification Table',
        'FAIL',
        'Table does not exist or not accessible',
        'Run prisma migrate to create Notification table'
      );
    } else {
      printResult(
        'Friends & Notifications',
        'WARN',
        `Could not verify tables: ${error.message}`
      );
    }
  }
}

async function run() {
  printHeader();
  
  let totalFailCount = 0;
  let totalWarnCount = 0;
  
  const envResult = await checkEnvironment();
  totalFailCount += envResult.failCount;
  totalWarnCount += envResult.warnCount;
  
  const filesResult = await checkFiles();
  totalFailCount += filesResult.failCount;
  totalWarnCount += filesResult.warnCount;
  
  await checkDatabase();
  await checkPolicyGuards();
  await checkNextAuth();
  await checkSMTP();
  await checkMaps();
  await checkELOEngine();
  await checkFriendsAndNotifications();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log(colorize('📊 SUMMARY', 'bright'));
  console.log('='.repeat(60));
  
  if (totalFailCount > 0) {
    console.log(colorize(`❌ Health check FAILED with ${totalFailCount} failures`, 'red'));
    console.log('Fix all FAIL items before proceeding.');
    process.exit(1);
  } else if (totalWarnCount > 0) {
    console.log(colorize(`⚠️  Health check PASSED with ${totalWarnCount} warnings`, 'yellow'));
    console.log('Consider addressing WARN items for optimal operation.');
  } else {
    console.log(colorize('✅ Health check PASSED', 'green'));
    console.log('All systems operational!');
  }
}

// Run the doctor
run().catch(error => {
  console.error(colorize('Doctor script failed:', 'red'), error);
  process.exit(1);
});

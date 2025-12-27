import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';

/**
 * Test database utility for integration tests
 * Creates a fresh database with only migrations (no seed data)
 */
export class TestDatabase {
  private prisma: PrismaClient;
  private databaseUrl: string;
  private originalDatabaseUrl: string;

  constructor() {
    // Generate a unique test database name
    const testDbName = `test_${randomBytes(8).toString('hex')}`;
    
    // Get the original DATABASE_URL
    this.originalDatabaseUrl = process.env.DATABASE_URL || '';
    
    if (!this.originalDatabaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Create a test database URL
    // For PostgreSQL: postgresql://user:password@host:port/database
    const url = new URL(this.originalDatabaseUrl);
    url.pathname = `/${testDbName}`;
    this.databaseUrl = url.toString();

    // Create Prisma client with test database URL
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.databaseUrl,
        },
      },
    });
  }

  /**
   * Set up the test database by:
   * 1. Creating the database
   * 2. Running migrations
   * 3. NOT seeding data (this is the key difference from dev setup)
   */
  async setup(): Promise<void> {
    try {
      // Extract database name and connection info
      const url = new URL(this.databaseUrl);
      const dbName = url.pathname.slice(1);
      const baseUrl = this.originalDatabaseUrl.substring(0, this.originalDatabaseUrl.lastIndexOf('/'));

      // Create the database using psql or Prisma
      console.log(`Creating test database: ${dbName}`);
      
      // Use Prisma to create database
      // Try connecting to 'postgres' database first, fallback to template1
      let adminPrisma: PrismaClient | null = null;
      let connected = false;

      for (const defaultDb of ['postgres', 'template1']) {
        try {
          adminPrisma = new PrismaClient({
            datasources: {
              db: {
                url: baseUrl + `/${defaultDb}`,
              },
            },
          });
          await adminPrisma.$connect();
          connected = true;
          break;
        } catch (error) {
          // Try next default database
          if (adminPrisma) {
            await adminPrisma.$disconnect().catch(() => {});
          }
        }
      }

      if (!adminPrisma || !connected) {
        throw new Error('Could not connect to PostgreSQL to create test database');
      }

      try {
        // Escape database name for SQL
        const escapedDbName = dbName.replace(/"/g, '""');
        await adminPrisma.$executeRawUnsafe(`CREATE DATABASE "${escapedDbName}"`);
      } catch (error: any) {
        // Database might already exist, try to drop it first
        if (error.code === '42P04' || error.message?.includes('already exists')) {
          const escapedDbName = dbName.replace(/"/g, '""');
          // Terminate connections first
          await adminPrisma.$executeRawUnsafe(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '${escapedDbName}' AND pid <> pg_backend_pid()
          `).catch(() => {}); // Ignore errors if no connections exist
          
          await adminPrisma.$executeRawUnsafe(`DROP DATABASE "${escapedDbName}"`);
          await adminPrisma.$executeRawUnsafe(`CREATE DATABASE "${escapedDbName}"`);
        } else {
          throw error;
        }
      } finally {
        await adminPrisma.$disconnect();
      }

      // Set DATABASE_URL for migrations
      process.env.DATABASE_URL = this.databaseUrl;

      // Run migrations
      console.log('Running migrations on test database...');
      execSync('npx prisma migrate deploy', {
        stdio: process.env.CI ? 'pipe' : 'inherit',
        env: { ...process.env, DATABASE_URL: this.databaseUrl },
      });

      // Generate Prisma client (if needed)
      // Note: This might not be necessary if client is already generated
      try {
        execSync('npx prisma generate', {
          stdio: process.env.CI ? 'pipe' : 'inherit',
          env: { ...process.env, DATABASE_URL: this.databaseUrl },
        });
      } catch (error) {
        // Client generation might fail if already generated, that's okay
        console.warn('Prisma generate warning (may be safe to ignore):', error);
      }

      // Connect to the test database
      await this.prisma.$connect();
      console.log('Test database setup complete');
    } catch (error) {
      console.error('Failed to setup test database:', error);
      throw error;
    }
  }

  /**
   * Clean up the test database
   */
  async cleanup(): Promise<void> {
    try {
      // Disconnect Prisma client
      await this.prisma.$disconnect();

      // Extract database name
      const url = new URL(this.databaseUrl);
      const dbName = url.pathname.slice(1);
      const baseUrl = this.originalDatabaseUrl.substring(0, this.originalDatabaseUrl.lastIndexOf('/'));

      // Try to connect to admin database
      let adminPrisma: PrismaClient | null = null;
      for (const defaultDb of ['postgres', 'template1']) {
        try {
          adminPrisma = new PrismaClient({
            datasources: {
              db: {
                url: baseUrl + `/${defaultDb}`,
              },
            },
          });
          await adminPrisma.$connect();
          break;
        } catch (error) {
          if (adminPrisma) {
            await adminPrisma.$disconnect().catch(() => {});
          }
        }
      }

      if (adminPrisma) {
        try {
          const escapedDbName = dbName.replace(/"/g, '""');
          
          // Terminate all connections to the test database
          await adminPrisma.$executeRawUnsafe(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '${escapedDbName}' AND pid <> pg_backend_pid()
          `).catch(() => {}); // Ignore if no connections exist

          // Drop the database
          await adminPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${escapedDbName}"`);
        } catch (error) {
          console.warn('Failed to drop test database (may need manual cleanup):', error);
        } finally {
          await adminPrisma.$disconnect();
        }
      }

      // Restore original DATABASE_URL
      process.env.DATABASE_URL = this.originalDatabaseUrl;

      console.log('Test database cleaned up');
    } catch (error) {
      console.error('Failed to cleanup test database:', error);
      // Don't throw - cleanup errors shouldn't fail tests
    }
  }

  /**
   * Get the Prisma client for the test database
   */
  getClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Clear all data from the test database (but keep schema)
   */
  async clear(): Promise<void> {
    // Delete in order to respect foreign key constraints
    await this.prisma.notification.deleteMany();
    await this.prisma.friendship.deleteMany();
    await this.prisma.userMetricEntry.deleteMany();
    await this.prisma.userClassElo.deleteMany();
    await this.prisma.eloEvent.deleteMany();
    await this.prisma.reviewToken.deleteMany();
    await this.prisma.userPrefs.deleteMany();
    await this.prisma.account.deleteMany();
    await this.prisma.session.deleteMany();
    await this.prisma.user.deleteMany();
    await this.prisma.metric.deleteMany();
    await this.prisma.gym.deleteMany();
    await this.prisma.class.deleteMany();
  }

  /**
   * Verify database is empty (only schema, no data)
   */
  async verifyEmpty(): Promise<boolean> {
    const counts = await Promise.all([
      this.prisma.user.count(),
      this.prisma.metric.count(),
      this.prisma.gym.count(),
      this.prisma.class.count(),
      this.prisma.userMetricEntry.count(),
    ]);

    return counts.every(count => count === 0);
  }
}

/**
 * Helper to create minimal required data for testing
 * This simulates what would happen in a fresh production environment
 */
export async function createMinimalTestData(prisma: PrismaClient) {
  // Create the 5 required classes (these are required by the schema)
  const classes = await Promise.all([
    prisma.class.create({
      data: {
        slug: 'titan',
        name: 'The Titan',
      },
    }),
    prisma.class.create({
      data: {
        slug: 'beast',
        name: 'The Beast',
      },
    }),
    prisma.class.create({
      data: {
        slug: 'bodyweight_master',
        name: 'The Body Weight Master',
      },
    }),
    prisma.class.create({
      data: {
        slug: 'hunter_gatherer',
        name: 'The Hunter Gatherer',
      },
    }),
    prisma.class.create({
      data: {
        slug: 'super_athlete',
        name: 'The Super Athlete',
      },
    }),
  ]);

  return { classes };
}


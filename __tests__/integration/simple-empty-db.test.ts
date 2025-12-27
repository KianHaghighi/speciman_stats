import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/utils/prisma';

/**
 * Simpler integration tests that use the existing database
 * but clear it before each test to simulate an empty database
 * 
 * WARNING: These tests will clear your database!
 * Only run these in a test/development environment.
 * 
 * Set TEST_DATABASE_URL or use a separate test database.
 */
describe('Simple Empty Database Tests (uses existing DB)', () => {
  const isTestEnvironment = process.env.NODE_ENV === 'test' || 
                           process.env.CI === 'true' ||
                           process.env.DATABASE_URL?.includes('test');

  beforeAll(() => {
    if (!isTestEnvironment) {
      console.warn('⚠️  WARNING: These tests will clear your database!');
      console.warn('⚠️  Set NODE_ENV=test or use a test database URL');
    }
  });

  beforeEach(async () => {
    // Clear all data (but keep schema)
    // This simulates an empty database
    await prisma.notification.deleteMany();
    await prisma.friendship.deleteMany();
    await prisma.userMetricEntry.deleteMany();
    await prisma.userClassElo.deleteMany();
    await prisma.eloEvent.deleteMany();
    await prisma.reviewToken.deleteMany();
    await prisma.userPrefs.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.metric.deleteMany();
    await prisma.gym.deleteMany();
    await prisma.class.deleteMany();
  });

  afterAll(async () => {
    // Optionally restore seed data
    // Or leave empty for manual testing
  });

  describe('Empty Database Queries', () => {
    it('should return empty arrays for all queries', async () => {
      const [users, metrics, entries, gyms, classes] = await Promise.all([
        prisma.user.findMany(),
        prisma.metric.findMany(),
        prisma.userMetricEntry.findMany(),
        prisma.gym.findMany(),
        prisma.class.findMany(),
      ]);

      expect(users).toEqual([]);
      expect(metrics).toEqual([]);
      expect(entries).toEqual([]);
      expect(gyms).toEqual([]);
      expect(classes).toEqual([]);
    });

    it('should handle count queries on empty tables', async () => {
      const counts = await Promise.all([
        prisma.user.count(),
        prisma.metric.count(),
        prisma.userMetricEntry.count(),
        prisma.gym.count(),
        prisma.class.count(),
      ]);

      expect(counts.every(count => count === 0)).toBe(true);
    });

    it('should handle findUnique with non-existent IDs', async () => {
      const user = await prisma.user.findUnique({
        where: { id: 'non-existent-id' },
      });
      expect(user).toBeNull();
    });
  });

  describe('Creating First Records', () => {
    it('should create first class', async () => {
      const newClass = await prisma.class.create({
        data: {
          slug: 'test_class',
          name: 'Test Class',
        },
      });

      expect(newClass.id).toBeDefined();
      expect(newClass.slug).toBe('test_class');
    });

    it('should create first user with class', async () => {
      const testClass = await prisma.class.create({
        data: {
          slug: 'user_class',
          name: 'User Class',
        },
      });

      const user = await prisma.user.create({
        data: {
          email: 'first@example.com',
          displayName: 'First User',
          name: 'First User',
          gender: 'MALE',
          primaryClassId: testClass.id,
        },
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('first@example.com');
    });

    it('should create first metric entry', async () => {
      const testClass = await prisma.class.create({
        data: {
          slug: 'metric_class',
          name: 'Metric Class',
        },
      });

      const user = await prisma.user.create({
        data: {
          email: 'entry@example.com',
          displayName: 'Entry User',
          name: 'Entry User',
          gender: 'MALE',
          primaryClassId: testClass.id,
        },
      });

      const metric = await prisma.metric.create({
        data: {
          classId: testClass.id,
          name: 'Test Metric',
          slug: 'test_metric',
          unit: 'kg',
          higherIsBetter: true,
        },
      });

      const entry = await prisma.userMetricEntry.create({
        data: {
          userId: user.id,
          metricId: metric.id,
          value: 100,
        },
      });

      expect(entry.id).toBeDefined();
      expect(entry.value).toBe(100);
    });
  });

  describe('API-like Queries', () => {
    it('should handle metrics.all query (empty)', async () => {
      const metrics = await prisma.metric.findMany({
        orderBy: { name: 'asc' },
      });
      expect(metrics).toEqual([]);
    });

    it('should handle userEntries query (empty)', async () => {
      const testClass = await prisma.class.create({
        data: {
          slug: 'test',
          name: 'Test',
        },
      });

      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          displayName: 'Test',
          name: 'Test',
          gender: 'MALE',
          primaryClassId: testClass.id,
        },
      });

      const entries = await prisma.userMetricEntry.findMany({
        where: { userId: user.id },
        include: {
          metric: {
            select: {
              id: true,
              name: true,
              slug: true,
              higherIsBetter: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(entries).toEqual([]);
    });

    it('should handle leaderboard query (empty)', async () => {
      const testClass = await prisma.class.create({
        data: {
          slug: 'test',
          name: 'Test',
        },
      });

      const metric = await prisma.metric.create({
        data: {
          classId: testClass.id,
          name: 'Test Metric',
          slug: 'test_metric',
          unit: 'kg',
          higherIsBetter: true,
        },
      });

      const bestEntries = await prisma.$queryRaw`
        WITH RankedEntries AS (
          SELECT 
            e.*,
            ROW_NUMBER() OVER (PARTITION BY e."userId" ORDER BY e.value DESC) as rank
          FROM "UserMetricEntry" e
          WHERE e."metricId" = ${metric.id}
        )
        SELECT * FROM RankedEntries
        WHERE rank = 1
        ORDER BY value DESC
        LIMIT 100
      `;

      expect(Array.isArray(bestEntries)).toBe(true);
      expect((bestEntries as any[]).length).toBe(0);
    });
  });
});


import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { TestDatabase, createMinimalTestData } from '../utils/test-db';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Integration tests for API endpoints with empty database
 * These tests verify that API endpoints work correctly when there's no pre-loaded data
 */
describe('API Endpoints with Empty Database', () => {
  let testDb: TestDatabase;
  let testPrisma: ReturnType<typeof testDb.getClient>;
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
    testPrisma = testDb.getClient();
  }, 60000);

  afterAll(async () => {
    await testDb.cleanup();
  }, 30000);

  beforeEach(async () => {
    await testDb.clear();
    // Create minimal required data (just classes)
    await createMinimalTestData(testPrisma);

    // Setup mock request/response
    mockReq = {
      method: 'GET',
      body: {},
      query: {},
      headers: {},
    };

    mockRes = {
      status: (code: number) => {
        (mockRes as any).statusCode = code;
        return mockRes as NextApiResponse;
      },
      json: (data: any) => {
        (mockRes as any).jsonData = data;
        return mockRes as NextApiResponse;
      },
    };
  });

  describe('Health Check Endpoint', () => {
    it('should return healthy status with empty database', async () => {
      // Mock the health check handler
      const handler = (await import('@/pages/api/health')).default;
      
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect((mockRes as any).statusCode).toBe(200);
      expect((mockRes as any).jsonData).toMatchObject({
        status: 'healthy',
        database: 'connected',
        userCount: 0,
      });
    });
  });

  describe('Metrics API', () => {
    it('should return empty array when no metrics exist', async () => {
      // This would typically be called via tRPC, but we can test the underlying query
      const metrics = await testPrisma.metric.findMany({
        orderBy: { name: 'asc' },
      });

      expect(metrics).toEqual([]);
      expect(metrics.length).toBe(0);
    });

    it('should handle creating first metric', async () => {
      const { classes } = await createMinimalTestData(testPrisma);

      const metric = await testPrisma.metric.create({
        data: {
          classId: classes[0].id,
          name: 'Bench Press',
          slug: 'bench_press',
          unit: 'kg',
          higherIsBetter: true,
        },
      });

      expect(metric).toBeDefined();
      expect(metric.name).toBe('Bench Press');

      // Verify it can be queried
      const found = await testPrisma.metric.findUnique({
        where: { id: metric.id },
      });
      expect(found).toBeDefined();
    });
  });

  describe('User Entries API', () => {
    it('should return empty array when user has no entries', async () => {
      const { classes } = await createMinimalTestData(testPrisma);

      const user = await testPrisma.user.create({
        data: {
          email: 'noentries@example.com',
          displayName: 'No Entries User',
          name: 'No Entries User',
          gender: 'MALE',
          primaryClassId: classes[0].id,
        },
      });

      const entries = await testPrisma.userMetricEntry.findMany({
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

    it('should handle creating first entry for a user', async () => {
      const { classes } = await createMinimalTestData(testPrisma);

      const user = await testPrisma.user.create({
        data: {
          email: 'firstentry@example.com',
          displayName: 'First Entry User',
          name: 'First Entry User',
          gender: 'MALE',
          primaryClassId: classes[0].id,
        },
      });

      const metric = await testPrisma.metric.create({
        data: {
          classId: classes[0].id,
          name: 'Squat',
          slug: 'squat',
          unit: 'kg',
          higherIsBetter: true,
        },
      });

      const entry = await testPrisma.userMetricEntry.create({
        data: {
          userId: user.id,
          metricId: metric.id,
          value: 150,
          status: 'PENDING',
        },
      });

      expect(entry).toBeDefined();
      expect(entry.value).toBe(150);

      // Verify it can be queried
      const userEntries = await testPrisma.userMetricEntry.findMany({
        where: { userId: user.id },
      });
      expect(userEntries).toHaveLength(1);
    });
  });

  describe('Leaderboard API', () => {
    it('should handle leaderboard query with no entries', async () => {
      const { classes } = await createMinimalTestData(testPrisma);

      const metric = await testPrisma.metric.create({
        data: {
          classId: classes[0].id,
          name: 'Deadlift',
          slug: 'deadlift',
          unit: 'kg',
          higherIsBetter: true,
        },
      });

      // Query leaderboard (simulating the tRPC query)
      const bestEntries = await testPrisma.$queryRaw`
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

    it('should handle leaderboard with single entry', async () => {
      const { classes } = await createMinimalTestData(testPrisma);

      const user = await testPrisma.user.create({
        data: {
          email: 'leaderboard@example.com',
          displayName: 'Leaderboard User',
          name: 'Leaderboard User',
          gender: 'MALE',
          primaryClassId: classes[0].id,
        },
      });

      const metric = await testPrisma.metric.create({
        data: {
          classId: classes[0].id,
          name: 'Pull Ups',
          slug: 'pull_ups',
          unit: 'reps',
          higherIsBetter: true,
        },
      });

      await testPrisma.userMetricEntry.create({
        data: {
          userId: user.id,
          metricId: metric.id,
          value: 20,
          status: 'APPROVED',
        },
      });

      const bestEntries = await testPrisma.$queryRaw`
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

      expect((bestEntries as any[]).length).toBe(1);
      expect((bestEntries as any[])[0].value).toBe(20);
    });
  });

  describe('User Stats API', () => {
    it('should handle user stats with no entries', async () => {
      const { classes } = await createMinimalTestData(testPrisma);

      const user = await testPrisma.user.findUnique({
        where: { id: 'non-existent' },
        include: {
          metricEntries: {
            include: {
              metric: true,
            },
          },
          primaryClass: true,
          gym: true,
        },
      });

      // User doesn't exist, but we can test the structure
      expect(user).toBeNull();

      // Create a user with no entries
      const newUser = await testPrisma.user.create({
        data: {
          email: 'nostats@example.com',
          displayName: 'No Stats User',
          name: 'No Stats User',
          gender: 'MALE',
          primaryClassId: classes[0].id,
        },
        include: {
          metricEntries: true,
        },
      });

      expect(newUser.metricEntries).toEqual([]);
      expect(newUser.metricEntries.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent metric', async () => {
      const metric = await testPrisma.metric.findUnique({
        where: { id: 'non-existent-metric-id' },
      });

      expect(metric).toBeNull();
    });

    it('should handle foreign key constraint errors gracefully', async () => {
      // Try to create entry with non-existent user
      await expect(
        testPrisma.userMetricEntry.create({
          data: {
            userId: 'non-existent-user',
            metricId: 'non-existent-metric',
            value: 100,
          },
        })
      ).rejects.toThrow();
    });
  });
});


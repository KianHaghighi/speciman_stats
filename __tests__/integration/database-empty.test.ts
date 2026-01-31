import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDatabase, createMinimalTestData } from '../utils/test-db';
import { prisma } from '@/utils/prisma';

/**
 * Integration tests to verify the database works correctly
 * with NO pre-loaded data (only schema, no seed data)
 */
describe('Database with Empty Data', () => {
  let testDb: TestDatabase;
  let testPrisma: ReturnType<typeof testDb.getClient>;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
    testPrisma = testDb.getClient();
  }, 60000); // 60 second timeout for setup

  afterAll(async () => {
    await testDb.cleanup();
  }, 30000);

  describe('Empty Database State', () => {
    it('should have no users', async () => {
      const count = await testPrisma.user.count();
      expect(count).toBe(0);
    });

    it('should have no metrics', async () => {
      const count = await testPrisma.metric.count();
      expect(count).toBe(0);
    });

    it('should have no gyms', async () => {
      const count = await testPrisma.gym.count();
      expect(count).toBe(0);
    });

    it('should have no classes', async () => {
      const count = await testPrisma.class.count();
      expect(count).toBe(0);
    });

    it('should have no entries', async () => {
      const count = await testPrisma.userMetricEntry.count();
      expect(count).toBe(0);
    });

    it('should verify database is completely empty', async () => {
      const isEmpty = await testDb.verifyEmpty();
      expect(isEmpty).toBe(true);
    });
  });

  describe('Querying Empty Data', () => {
    it('should return empty array when querying users', async () => {
      const users = await testPrisma.user.findMany();
      expect(users).toEqual([]);
      expect(users.length).toBe(0);
    });

    it('should return empty array when querying metrics', async () => {
      const metrics = await testPrisma.metric.findMany();
      expect(metrics).toEqual([]);
    });

    it('should return empty array when querying entries', async () => {
      const entries = await testPrisma.userMetricEntry.findMany();
      expect(entries).toEqual([]);
    });

    it('should return null when finding non-existent user', async () => {
      const user = await testPrisma.user.findUnique({
        where: { id: 'non-existent-id' },
      });
      expect(user).toBeNull();
    });

    it('should return null when finding non-existent metric', async () => {
      const metric = await testPrisma.metric.findUnique({
        where: { id: 'non-existent-id' },
      });
      expect(metric).toBeNull();
    });
  });

  describe('Creating Data from Scratch', () => {
    it('should create a class successfully', async () => {
      const newClass = await testPrisma.class.create({
        data: {
          slug: 'test_class',
          name: 'Test Class',
        },
      });

      expect(newClass).toBeDefined();
      expect(newClass.slug).toBe('test_class');
      expect(newClass.name).toBe('Test Class');
    });

    it('should create a user successfully', async () => {
      // First create a class (required for user)
      const testClass = await testPrisma.class.create({
        data: {
          slug: 'user_test_class',
          name: 'User Test Class',
        },
      });

      const user = await testPrisma.user.create({
        data: {
          email: 'test@example.com',
          displayName: 'Test User',
          name: 'Test User',
          gender: 'MALE',
          primaryClassId: testClass.id,
          overallElo: 1000,
        },
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.overallElo).toBe(1000);
    });

    it('should create a gym successfully', async () => {
      const gym = await testPrisma.gym.create({
        data: {
          name: 'Test Gym',
          city: 'Test City',
          state: 'CA',
          country: 'USA',
          lat: 34.0522,
          lng: -118.2437,
        },
      });

      expect(gym).toBeDefined();
      expect(gym.name).toBe('Test Gym');
    });

    it('should create a metric successfully', async () => {
      // First create a class (required for metric)
      const testClass = await testPrisma.class.create({
        data: {
          slug: 'metric_test_class',
          name: 'Metric Test Class',
        },
      });

      const metric = await testPrisma.metric.create({
        data: {
          classId: testClass.id,
          name: 'Test Metric',
          slug: 'test_metric',
          unit: 'kg',
          higherIsBetter: true,
        },
      });

      expect(metric).toBeDefined();
      expect(metric.name).toBe('Test Metric');
      expect(metric.slug).toBe('test_metric');
    });

    it('should create a metric entry successfully', async () => {
      // Create required dependencies
      const testClass = await testPrisma.class.create({
        data: {
          slug: 'entry_test_class',
          name: 'Entry Test Class',
        },
      });

      const user = await testPrisma.user.create({
        data: {
          email: 'entry@example.com',
          displayName: 'Entry User',
          name: 'Entry User',
          gender: 'MALE',
          primaryClassId: testClass.id,
        },
      });

      const metric = await testPrisma.metric.create({
        data: {
          classId: testClass.id,
          name: 'Bench Press',
          slug: 'bench_press',
          unit: 'kg',
          higherIsBetter: true,
        },
      });

      // Create entry
      const entry = await testPrisma.userMetricEntry.create({
        data: {
          userId: user.id,
          metricId: metric.id,
          value: 100,
          status: 'PENDING',
        },
      });

      expect(entry).toBeDefined();
      expect(entry.value).toBe(100);
      expect(entry.status).toBe('PENDING');
    });
  });

  describe('Minimal Required Data Setup', () => {
    it('should create minimal required classes', async () => {
      // Clear any existing data
      await testDb.clear();

      // Create minimal test data (just classes)
      const { classes } = await createMinimalTestData(testPrisma);

      expect(classes).toHaveLength(5);
      expect(classes[0].slug).toBe('titan');
      expect(classes[1].slug).toBe('beast');
      expect(classes[2].slug).toBe('bodyweight_master');
      expect(classes[3].slug).toBe('hunter_gatherer');
      expect(classes[4].slug).toBe('super_athlete');
    });

    it('should allow creating user with minimal classes', async () => {
      await testDb.clear();
      const { classes } = await createMinimalTestData(testPrisma);

      const user = await testPrisma.user.create({
        data: {
          email: 'minimal@example.com',
          displayName: 'Minimal User',
          name: 'Minimal User',
          gender: 'MALE',
          primaryClassId: classes[0].id,
        },
      });

      expect(user).toBeDefined();
      expect(user.primaryClassId).toBe(classes[0].id);
    });
  });

  describe('Edge Cases with Empty Data', () => {
    beforeEach(async () => {
      await testDb.clear();
    });

    it('should handle count queries on empty tables', async () => {
      const userCount = await testPrisma.user.count();
      const metricCount = await testPrisma.metric.count();
      const entryCount = await testPrisma.userMetricEntry.count();

      expect(userCount).toBe(0);
      expect(metricCount).toBe(0);
      expect(entryCount).toBe(0);
    });

    it('should handle findMany with where clause on empty data', async () => {
      const users = await testPrisma.user.findMany({
        where: {
          gender: 'MALE',
        },
      });

      expect(users).toEqual([]);
    });

    it('should handle aggregations on empty data', async () => {
      const result = await testPrisma.userMetricEntry.aggregate({
        _count: true,
        _avg: { value: true },
        _max: { value: true },
        _min: { value: true },
        _sum: { value: true },
      });

      expect(result._count).toBe(0);
      expect(result._avg.value).toBeNull();
      expect(result._max.value).toBeNull();
      expect(result._min.value).toBeNull();
      expect(result._sum.value).toBeNull();
    });
  });
});


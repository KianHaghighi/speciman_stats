import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { TestDatabase, createMinimalTestData } from '../utils/test-db';

/**
 * Integration tests for database UPDATE operations
 * Tests verify that updates persist correctly, handle relationships properly,
 * and work with non-seeded data (empty database)
 */
describe('Database Updates', () => {
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

  beforeEach(async () => {
    await testDb.clear();
  });

  describe('User Profile Updates', () => {
    describe('Basic User Field Updates', () => {
      it('should update displayName and verify persistence', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        // Create user
        const user = await testPrisma.user.create({
          data: {
            email: 'update@example.com',
            displayName: 'Original Name',
            name: 'Original Name',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        // Update displayName
        await testPrisma.user.update({
          where: { id: user.id },
          data: { displayName: 'Updated Name' },
        });

        // Query fresh to verify persistence
        const updatedUser = await testPrisma.user.findUnique({
          where: { id: user.id },
        });

        expect(updatedUser).toBeDefined();
        expect(updatedUser?.displayName).toBe('Updated Name');
        expect(updatedUser?.name).toBe('Original Name'); // Other fields unchanged
      });

      it('should update gender enum field', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'gender@example.com',
            displayName: 'Gender Test',
            name: 'Gender Test',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        // Test all enum values
        const genders: Array<'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED'> = [
          'FEMALE',
          'OTHER',
          'UNSPECIFIED',
          'MALE',
        ];

        for (const gender of genders) {
          await testPrisma.user.update({
            where: { id: user.id },
            data: { gender },
          });

          const updated = await testPrisma.user.findUnique({
            where: { id: user.id },
          });

          expect(updated?.gender).toBe(gender);
        }
      });

      it('should update name field', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'name@example.com',
            displayName: 'Name Test',
            name: 'Original Name',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        await testPrisma.user.update({
          where: { id: user.id },
          data: { name: 'Updated Name' },
        });

        const updated = await testPrisma.user.findUnique({
          where: { id: user.id },
        });

        expect(updated?.name).toBe('Updated Name');
      });

      it('should update email with unique constraint validation', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user1 = await testPrisma.user.create({
          data: {
            email: 'user1@example.com',
            displayName: 'User 1',
            name: 'User 1',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        const user2 = await testPrisma.user.create({
          data: {
            email: 'user2@example.com',
            displayName: 'User 2',
            name: 'User 2',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        // Update user1 email to a new unique email
        await testPrisma.user.update({
          where: { id: user1.id },
          data: { email: 'user1new@example.com' },
        });

        const updated = await testPrisma.user.findUnique({
          where: { id: user1.id },
        });
        expect(updated?.email).toBe('user1new@example.com');

        // Try to update user2 to same email as user1 (should fail)
        await expect(
          testPrisma.user.update({
            where: { id: user2.id },
            data: { email: 'user1new@example.com' },
          })
        ).rejects.toThrow();
      });

      it('should update multiple fields in single operation', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'multi@example.com',
            displayName: 'Original',
            name: 'Original',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        await testPrisma.user.update({
          where: { id: user.id },
          data: {
            displayName: 'Updated Display',
            name: 'Updated Name',
            gender: 'FEMALE',
          },
        });

        const updated = await testPrisma.user.findUnique({
          where: { id: user.id },
        });

        expect(updated?.displayName).toBe('Updated Display');
        expect(updated?.name).toBe('Updated Name');
        expect(updated?.gender).toBe('FEMALE');
        expect(updated?.email).toBe('multi@example.com'); // Unchanged
      });
    });

    describe('Relationship Updates', () => {
      it('should update primaryClassId with valid class', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'class@example.com',
            displayName: 'Class Test',
            name: 'Class Test',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        // Update to different class
        await testPrisma.user.update({
          where: { id: user.id },
          data: { primaryClassId: classes[1].id },
        });

        const updated = await testPrisma.user.findUnique({
          where: { id: user.id },
          include: { primaryClass: true },
        });

        expect(updated?.primaryClassId).toBe(classes[1].id);
        expect(updated?.primaryClass?.id).toBe(classes[1].id);
        expect(updated?.primaryClass?.slug).toBe('beast');
      });

      it('should fail to update primaryClassId with invalid class', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'invalid@example.com',
            displayName: 'Invalid Test',
            name: 'Invalid Test',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        // Try to update with non-existent class ID
        await expect(
          testPrisma.user.update({
            where: { id: user.id },
            data: { primaryClassId: 'non-existent-class-id' },
          })
        ).rejects.toThrow();
      });

      it('should update gymId and verify relationship', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const gym = await testPrisma.gym.create({
          data: {
            name: 'Test Gym',
            city: 'Test City',
            state: 'CA',
            country: 'USA',
          },
        });

        const user = await testPrisma.user.create({
          data: {
            email: 'gym@example.com',
            displayName: 'Gym Test',
            name: 'Gym Test',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        // Update user with gym
        await testPrisma.user.update({
          where: { id: user.id },
          data: { gymId: gym.id },
        });

        const updated = await testPrisma.user.findUnique({
          where: { id: user.id },
          include: { gym: true },
        });

        expect(updated?.gymId).toBe(gym.id);
        expect(updated?.gym?.id).toBe(gym.id);
        expect(updated?.gym?.name).toBe('Test Gym');
      });

      it('should allow removing gym association (setting to null)', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const gym = await testPrisma.gym.create({
          data: {
            name: 'Test Gym',
            city: 'Test City',
            state: 'CA',
            country: 'USA',
          },
        });

        const user = await testPrisma.user.create({
          data: {
            email: 'nogym@example.com',
            displayName: 'No Gym Test',
            name: 'No Gym Test',
            gender: 'MALE',
            primaryClassId: classes[0].id,
            gymId: gym.id,
          },
        });

        // Remove gym association
        await testPrisma.user.update({
          where: { id: user.id },
          data: { gymId: null },
        });

        const updated = await testPrisma.user.findUnique({
          where: { id: user.id },
        });

        expect(updated?.gymId).toBeNull();
      });
    });

    describe('Update Persistence Verification', () => {
      it('should persist updates across multiple queries', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'persist@example.com',
            displayName: 'Original',
            name: 'Original',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        // Update
        await testPrisma.user.update({
          where: { id: user.id },
          data: { displayName: 'Updated' },
        });

        // Query multiple times
        const query1 = await testPrisma.user.findUnique({
          where: { id: user.id },
        });
        const query2 = await testPrisma.user.findUnique({
          where: { id: user.id },
        });
        const query3 = await testPrisma.user.findUnique({
          where: { id: user.id },
        });

        expect(query1?.displayName).toBe('Updated');
        expect(query2?.displayName).toBe('Updated');
        expect(query3?.displayName).toBe('Updated');
      });

      it('should persist latest value after multiple updates', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'multiple@example.com',
            displayName: 'Version 1',
            name: 'Version 1',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        // Multiple updates
        await testPrisma.user.update({
          where: { id: user.id },
          data: { displayName: 'Version 2' },
        });

        await testPrisma.user.update({
          where: { id: user.id },
          data: { displayName: 'Version 3' },
        });

        await testPrisma.user.update({
          where: { id: user.id },
          data: { displayName: 'Version 4' },
        });

        const final = await testPrisma.user.findUnique({
          where: { id: user.id },
        });

        expect(final?.displayName).toBe('Version 4');
      });

      it('should update updatedAt timestamp', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'timestamp@example.com',
            displayName: 'Timestamp Test',
            name: 'Timestamp Test',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        const originalUpdatedAt = user.updatedAt;
        
        // Wait a bit to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 100));

        await testPrisma.user.update({
          where: { id: user.id },
          data: { displayName: 'Updated' },
        });

        const updated = await testPrisma.user.findUnique({
          where: { id: user.id },
        });

        expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      });
    });

    describe('Edge Cases', () => {
      it('should fail to update non-existent user', async () => {
        await expect(
          testPrisma.user.update({
            where: { id: 'non-existent-user-id' },
            data: { displayName: 'Should Fail' },
          })
        ).rejects.toThrow();
      });

      it('should fail to update with invalid enum value', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'enum@example.com',
            displayName: 'Enum Test',
            name: 'Enum Test',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        // TypeScript would catch this, but test runtime validation
        await expect(
          testPrisma.user.update({
            where: { id: user.id },
            // @ts-expect-error - Testing invalid enum value
            data: { gender: 'INVALID_GENDER' },
          })
        ).rejects.toThrow();
      });

      it('should allow partial updates (only some fields)', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'partial@example.com',
            displayName: 'Original Display',
            name: 'Original Name',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        // Update only displayName, leave other fields unchanged
        await testPrisma.user.update({
          where: { id: user.id },
          data: { displayName: 'Updated Display' },
        });

        const updated = await testPrisma.user.findUnique({
          where: { id: user.id },
        });

        expect(updated?.displayName).toBe('Updated Display');
        expect(updated?.name).toBe('Original Name'); // Unchanged
        expect(updated?.gender).toBe('MALE'); // Unchanged
        expect(updated?.email).toBe('partial@example.com'); // Unchanged
      });
    });
  });

  describe('Entry Status Updates', () => {
    describe('Entry Status Transitions', () => {
      it('should update entry from PENDING to APPROVED', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'entry@example.com',
            displayName: 'Entry User',
            name: 'Entry User',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        const metric = await testPrisma.metric.create({
          data: {
            classId: classes[0].id,
            name: 'Bench Press',
            slug: 'bench_press',
            unit: 'kg',
            higherIsBetter: true,
          },
        });

        const entry = await testPrisma.userMetricEntry.create({
          data: {
            userId: user.id,
            metricId: metric.id,
            value: 100,
            status: 'PENDING',
          },
        });

        // Update to APPROVED
        await testPrisma.userMetricEntry.update({
          where: { id: entry.id },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedById: user.id,
            reviewNotes: 'Looks good!',
          },
        });

        const updated = await testPrisma.userMetricEntry.findUnique({
          where: { id: entry.id },
        });

        expect(updated?.status).toBe('APPROVED');
        expect(updated?.reviewedAt).toBeDefined();
        expect(updated?.reviewedById).toBe(user.id);
        expect(updated?.reviewNotes).toBe('Looks good!');
      });

      it('should update entry from PENDING to REJECTED', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'reject@example.com',
            displayName: 'Reject User',
            name: 'Reject User',
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

        // Update to REJECTED
        await testPrisma.userMetricEntry.update({
          where: { id: entry.id },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewedById: user.id,
            reviewNotes: 'Video quality too poor',
          },
        });

        const updated = await testPrisma.userMetricEntry.findUnique({
          where: { id: entry.id },
        });

        expect(updated?.status).toBe('REJECTED');
        expect(updated?.reviewedAt).toBeDefined();
        expect(updated?.reviewNotes).toBe('Video quality too poor');
      });

      it('should verify reviewedAt timestamp is set on approval', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'timestamp2@example.com',
            displayName: 'Timestamp User',
            name: 'Timestamp User',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        const metric = await testPrisma.metric.create({
          data: {
            classId: classes[0].id,
            name: 'Deadlift',
            slug: 'deadlift',
            unit: 'kg',
            higherIsBetter: true,
          },
        });

        const entry = await testPrisma.userMetricEntry.create({
          data: {
            userId: user.id,
            metricId: metric.id,
            value: 200,
            status: 'PENDING',
          },
        });

        expect(entry.reviewedAt).toBeNull();

        const beforeUpdate = new Date();
        await testPrisma.userMetricEntry.update({
          where: { id: entry.id },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedById: user.id,
          },
        });
        const afterUpdate = new Date();

        const updated = await testPrisma.userMetricEntry.findUnique({
          where: { id: entry.id },
        });

        expect(updated?.reviewedAt).toBeDefined();
        expect(updated?.reviewedAt!.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
        expect(updated?.reviewedAt!.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
      });
    });

    describe('Entry Update Persistence', () => {
      it('should persist entry status update', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'persist2@example.com',
            displayName: 'Persist User',
            name: 'Persist User',
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

        const entry = await testPrisma.userMetricEntry.create({
          data: {
            userId: user.id,
            metricId: metric.id,
            value: 20,
            status: 'PENDING',
          },
        });

        await testPrisma.userMetricEntry.update({
          where: { id: entry.id },
          data: { status: 'APPROVED' },
        });

        // Query fresh
        const updated = await testPrisma.userMetricEntry.findUnique({
          where: { id: entry.id },
        });

        expect(updated?.status).toBe('APPROVED');
      });

      it('should update entry notes', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'notes@example.com',
            displayName: 'Notes User',
            name: 'Notes User',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        const metric = await testPrisma.metric.create({
          data: {
            classId: classes[0].id,
            name: 'Push Ups',
            slug: 'push_ups',
            unit: 'reps',
            higherIsBetter: true,
          },
        });

        const entry = await testPrisma.userMetricEntry.create({
          data: {
            userId: user.id,
            metricId: metric.id,
            value: 50,
            status: 'PENDING',
            notes: 'Original notes',
          },
        });

        await testPrisma.userMetricEntry.update({
          where: { id: entry.id },
          data: { notes: 'Updated notes with more details' },
        });

        const updated = await testPrisma.userMetricEntry.findUnique({
          where: { id: entry.id },
        });

        expect(updated?.notes).toBe('Updated notes with more details');
      });
    });
  });

  describe('ELO Updates', () => {
    describe('UserClassElo Updates', () => {
      it('should update UserClassElo ELO value and verify persistence', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'elo@example.com',
            displayName: 'ELO User',
            name: 'ELO User',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        const userClassElo = await testPrisma.userClassElo.create({
          data: {
            userId: user.id,
            classId: classes[0].id,
            elo: 1000,
          },
        });

        // Update ELO
        await testPrisma.userClassElo.update({
          where: { id: userClassElo.id },
          data: { elo: 1150 },
        });

        const updated = await testPrisma.userClassElo.findUnique({
          where: { id: userClassElo.id },
        });

        expect(updated?.elo).toBe(1150);
      });

      it('should auto-update updatedAt field on UserClassElo', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'elotime@example.com',
            displayName: 'ELO Time User',
            name: 'ELO Time User',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        const userClassElo = await testPrisma.userClassElo.create({
          data: {
            userId: user.id,
            classId: classes[0].id,
            elo: 1000,
          },
        });

        const originalUpdatedAt = userClassElo.updatedAt;

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 100));

        await testPrisma.userClassElo.update({
          where: { id: userClassElo.id },
          data: { elo: 1100 },
        });

        const updated = await testPrisma.userClassElo.findUnique({
          where: { id: userClassElo.id },
        });

        expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      });

      it('should persist latest ELO value after multiple updates', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'elomulti@example.com',
            displayName: 'ELO Multi User',
            name: 'ELO Multi User',
            gender: 'MALE',
            primaryClassId: classes[0].id,
          },
        });

        const userClassElo = await testPrisma.userClassElo.create({
          data: {
            userId: user.id,
            classId: classes[0].id,
            elo: 1000,
          },
        });

        // Multiple updates
        await testPrisma.userClassElo.update({
          where: { id: userClassElo.id },
          data: { elo: 1050 },
        });

        await testPrisma.userClassElo.update({
          where: { id: userClassElo.id },
          data: { elo: 1100 },
        });

        await testPrisma.userClassElo.update({
          where: { id: userClassElo.id },
          data: { elo: 1200 },
        });

        const final = await testPrisma.userClassElo.findUnique({
          where: { id: userClassElo.id },
        });

        expect(final?.elo).toBe(1200);
      });
    });

    describe('Overall ELO Updates', () => {
      it('should update user overallElo and verify persistence', async () => {
        const { classes } = await createMinimalTestData(testPrisma);

        const user = await testPrisma.user.create({
          data: {
            email: 'overall@example.com',
            displayName: 'Overall User',
            name: 'Overall User',
            gender: 'MALE',
            primaryClassId: classes[0].id,
            overallElo: 1000,
          },
        });

        await testPrisma.user.update({
          where: { id: user.id },
          data: { overallElo: 1250 },
        });

        const updated = await testPrisma.user.findUnique({
          where: { id: user.id },
        });

        expect(updated?.overallElo).toBe(1250);
      });
    });
  });

  describe('Transactional Updates', () => {
    it('should update user and create related records in transaction', async () => {
      const { classes } = await createMinimalTestData(testPrisma);

      const user = await testPrisma.user.create({
        data: {
          email: 'transaction@example.com',
          displayName: 'Transaction User',
          name: 'Transaction User',
          gender: 'MALE',
          primaryClassId: classes[0].id,
        },
      });

      const gym = await testPrisma.gym.create({
        data: {
          name: 'Transaction Gym',
          city: 'Transaction City',
          state: 'CA',
          country: 'USA',
        },
      });

      // Update user and create UserClassElo in transaction
      await testPrisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            displayName: 'Updated in Transaction',
            gymId: gym.id,
          },
        });

        await tx.userClassElo.create({
          data: {
            userId: user.id,
            classId: classes[1].id,
            elo: 1100,
          },
        });
      });

      // Verify both updates persisted
      const updatedUser = await testPrisma.user.findUnique({
        where: { id: user.id },
        include: { classElos: true },
      });

      expect(updatedUser?.displayName).toBe('Updated in Transaction');
      expect(updatedUser?.gymId).toBe(gym.id);
      expect(updatedUser?.classElos).toHaveLength(1);
      expect(updatedUser?.classElos[0]?.classId).toBe(classes[1].id);
    });

    it('should rollback transaction on error', async () => {
      const { classes } = await createMinimalTestData(testPrisma);

      const user = await testPrisma.user.create({
        data: {
          email: 'rollback@example.com',
          displayName: 'Original',
          name: 'Original',
          gender: 'MALE',
          primaryClassId: classes[0].id,
        },
      });

      // Try transaction that will fail
      await expect(
        testPrisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: user.id },
            data: { displayName: 'Should Not Persist' },
          });

          // This will fail (invalid foreign key)
          await tx.userClassElo.create({
            data: {
              userId: user.id,
              classId: 'invalid-class-id',
              elo: 1000,
            },
          });
        })
      ).rejects.toThrow();

      // Verify user was NOT updated (transaction rolled back)
      const userAfter = await testPrisma.user.findUnique({
        where: { id: user.id },
      });

      expect(userAfter?.displayName).toBe('Original');
    });
  });

  describe('Update Edge Cases', () => {
    it('should handle updating with invalid foreign key', async () => {
      const { classes } = await createMinimalTestData(testPrisma);

      const user = await testPrisma.user.create({
        data: {
          email: 'invalidfk@example.com',
          displayName: 'Invalid FK User',
          name: 'Invalid FK User',
          gender: 'MALE',
          primaryClassId: classes[0].id,
        },
      });

      // Try to update with invalid primaryClassId
      await expect(
        testPrisma.user.update({
          where: { id: user.id },
          data: { primaryClassId: 'definitely-invalid-id' },
        })
      ).rejects.toThrow();
    });

    it('should handle updating entry with invalid reviewer', async () => {
      const { classes } = await createMinimalTestData(testPrisma);

      const user = await testPrisma.user.create({
        data: {
          email: 'reviewer@example.com',
          displayName: 'Reviewer User',
          name: 'Reviewer User',
          gender: 'MALE',
          primaryClassId: classes[0].id,
        },
      });

      const metric = await testPrisma.metric.create({
        data: {
          classId: classes[0].id,
          name: 'Test Metric',
          slug: 'test_metric',
          unit: 'kg',
          higherIsBetter: true,
        },
      });

      const entry = await testPrisma.userMetricEntry.create({
        data: {
          userId: user.id,
          metricId: metric.id,
          value: 100,
          status: 'PENDING',
        },
      });

      // Try to update with invalid reviewer ID
      await expect(
        testPrisma.userMetricEntry.update({
          where: { id: entry.id },
          data: {
            status: 'APPROVED',
            reviewedById: 'invalid-reviewer-id',
          },
        })
      ).rejects.toThrow();
    });

    it('should handle updating non-existent entry', async () => {
      await expect(
        testPrisma.userMetricEntry.update({
          where: { id: 'non-existent-entry-id' },
          data: { status: 'APPROVED' },
        })
      ).rejects.toThrow();
    });

    it('should handle updating non-existent UserClassElo', async () => {
      await expect(
        testPrisma.userClassElo.update({
          where: { id: 'non-existent-elo-id' },
          data: { elo: 1200 },
        })
      ).rejects.toThrow();
    });
  });
});



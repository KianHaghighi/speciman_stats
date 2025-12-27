# Integration Tests for Empty Database

These integration tests verify that your application works correctly when the database contains **no pre-loaded seed data** - only the schema from migrations.

## Purpose

These tests answer the question: **"Will my application work in production when the database is fresh and empty?"**

In development, you typically use `prisma db seed` to populate the database with test data. However, in production, the database starts empty. These tests ensure your application handles empty data gracefully.

## What Gets Tested

1. **Empty Database State**: Verifies tables are empty
2. **Querying Empty Data**: Ensures queries return empty arrays/null instead of errors
3. **Creating Data from Scratch**: Tests that you can create users, metrics, entries without seed data
4. **API Endpoints**: Verifies API endpoints work with empty database
5. **Edge Cases**: Tests aggregations, counts, and other operations on empty data

## Running the Tests

### Prerequisites

1. **PostgreSQL Database**: You need a PostgreSQL database running
2. **DATABASE_URL**: Set in your environment (`.env` file)
3. **Database Permissions**: Your database user must be able to create/drop databases (for full tests)

### Two Testing Approaches

#### Option 1: Isolated Test Database (Recommended)

Uses `database-empty.test.ts` and `api-empty-db.test.ts` - creates a temporary test database.

**Pros:**
- Completely isolated from your dev database
- Safe to run anytime
- Tests true empty state

**Cons:**
- Requires database CREATE/DROP permissions
- Slightly slower setup

#### Option 2: Simple Tests (Quick Start)

Uses `simple-empty-db.test.ts` - clears your existing database before each test.

**Pros:**
- No special permissions needed
- Faster setup
- Good for quick validation

**Cons:**
- ⚠️ **WILL CLEAR YOUR DATABASE** - only use in test environment
- Uses your existing database connection

### Run Integration Tests

```bash
# Run all integration tests (isolated test database)
npm run test:integration

# Run specific test file
npx vitest __tests__/integration/database-empty.test.ts

# Run simple tests (clears existing DB - use with caution!)
npx vitest __tests__/integration/simple-empty-db.test.ts

# Run in watch mode
npx vitest __tests__/integration --watch
```

### Test Database Setup

**For isolated tests** (`database-empty.test.ts`):
1. Create a temporary test database (with a unique name)
2. Run migrations to set up the schema
3. **Do NOT run seed** (this is the key difference)
4. Run tests against the empty database
5. Clean up the test database after tests complete

**For simple tests** (`simple-empty-db.test.ts`):
1. Clear all data from your existing database
2. Run tests against empty database
3. Leave database empty (or restore manually)

## Test Structure

```
__tests__/
  integration/
    database-empty.test.ts    # Tests database operations with empty data
    api-empty-db.test.ts      # Tests API endpoints with empty database
  utils/
    test-db.ts                # Test database utility
```

## What to Look For

These tests will catch issues like:
- ❌ Code that assumes seed data exists
- ❌ Queries that fail on empty results
- ❌ Missing null/empty checks
- ❌ Foreign key constraints that require seed data
- ❌ Hardcoded IDs from seed data

## Example Test Scenario

```typescript
it('should return empty array when no metrics exist', async () => {
  const metrics = await testPrisma.metric.findMany();
  expect(metrics).toEqual([]); // Should work, not throw error
});
```

## Troubleshooting

### "Database connection failed"
- Check your `DATABASE_URL` is set correctly
- Ensure PostgreSQL is running
- Verify database user has CREATE DATABASE permissions

### "Test database cleanup failed"
- This is usually not critical - test databases may be left behind
- You can manually drop them: `DROP DATABASE test_*;`

### Tests are slow
- Integration tests are slower than unit tests (they use a real database)
- Consider running them separately from unit tests in CI

## CI/CD Integration

In your CI pipeline, you might want to:

```yaml
# Example GitHub Actions
- name: Run Integration Tests
  env:
    DATABASE_URL: postgresql://user:pass@localhost:5432/test_db
  run: npm run test:integration
```

## Manual Testing

You can also manually test with an empty database:

```bash
# 1. Create a fresh database
createdb test_empty_db

# 2. Set DATABASE_URL
export DATABASE_URL="postgresql://user:pass@localhost:5432/test_empty_db"

# 3. Run migrations (no seed)
npx prisma migrate deploy
npx prisma generate

# 4. Start your app and test manually
npm run dev
```

Then verify:
- ✅ App starts without errors
- ✅ You can create a user
- ✅ You can create metrics
- ✅ You can add entries
- ✅ Queries return empty arrays (not errors)


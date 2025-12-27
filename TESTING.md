# Testing Guide

This document explains how to test your application, especially with an **empty database** (no seed data).

## Quick Start

```bash
# Run all tests
npm test

# Run only unit tests (fast)
npm run test:unit

# Run integration tests (tests empty database)
npm run test:integration

# Run simple empty DB tests (clears your DB - use with caution!)
npx vitest __tests__/integration/simple-empty-db.test.ts
```

## Why Test with Empty Database?

In production, your database starts **empty** - only schema, no seed data. Testing with an empty database ensures:

- ✅ Your app works for the first user
- ✅ Queries handle empty results gracefully
- ✅ No hardcoded dependencies on seed data
- ✅ Proper error handling for missing data

## Test Types

### 1. Unit Tests (`__tests__/`)

Fast tests that don't use a database:
- ELO calculations
- Percentile calculations
- Utility functions

```bash
npm run test:unit
```

### 2. Integration Tests (`__tests__/integration/`)

Tests that use a real database with **no seed data**:

#### Isolated Test Database (Recommended)
- `database-empty.test.ts` - Tests database CREATE operations and empty queries
- `database-updates.test.ts` - Tests database UPDATE operations and persistence
- `api-empty-db.test.ts` - Tests API endpoints

These create a temporary test database, so they're safe to run anytime.

#### Simple Tests (Quick)
- `simple-empty-db.test.ts` - Clears your existing database

⚠️ **Warning**: These will clear your database! Only use in test environments.

### 3. E2E Tests (`cypress/e2e/`)

Full browser tests:
```bash
npm run test:e2e
```

## Testing Empty Database

### Method 1: Automated Integration Tests

```bash
# Run isolated tests (creates temp database)
npm run test:integration
```

### Method 2: Manual Testing

1. **Create a fresh database:**
   ```bash
   createdb test_empty_db
   ```

2. **Set DATABASE_URL:**
   ```bash
   export DATABASE_URL="postgresql://user:pass@localhost:5432/test_empty_db"
   ```

3. **Run migrations (NO seed):**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **Start your app:**
   ```bash
   npm run dev
   ```

5. **Test manually:**
   - ✅ App starts without errors
   - ✅ Can create first user
   - ✅ Can create metrics
   - ✅ Can add entries
   - ✅ Queries return empty arrays (not errors)

### Method 3: Simple Test Script

```bash
# This will clear your database and test
npx vitest __tests__/integration/simple-empty-db.test.ts
```

⚠️ **Only use this in a test environment!**

## What Gets Tested

### Empty Database State
- All tables are empty
- Count queries return 0
- FindMany returns empty arrays

### Creating First Records
- Can create first class
- Can create first user
- Can create first metric
- Can create first entry

### Updating Records
- User profile updates (name, email, gender, primaryClassId, gymId)
- Entry status updates (PENDING → APPROVED/REJECTED)
- ELO updates (UserClassElo, overallElo)
- Update persistence verification
- Foreign key relationship updates
- Transactional updates with rollback

### API Endpoints
- Health check works
- Metrics API returns empty arrays
- User entries API handles no entries
- Leaderboard queries work with no data

### Edge Cases
- Non-existent IDs return null
- Aggregations on empty data
- Foreign key constraints

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` is set
- Ensure PostgreSQL is running
- Verify database user permissions

### "Cannot create database"
- Your database user needs `CREATE DATABASE` permission
- Try using `simple-empty-db.test.ts` instead

### "Tests are slow"
- Integration tests are slower (they use real database)
- Run them separately from unit tests
- Consider using `test:unit` for faster feedback

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
- name: Run Integration Tests
  env:
    DATABASE_URL: postgresql://user:pass@localhost:5432/test_db
  run: npm run test:integration
```

## Best Practices

1. **Run unit tests frequently** (fast feedback)
2. **Run integration tests before commits** (catch DB issues)
3. **Use isolated test database** (safe, no side effects)
4. **Test empty database regularly** (production-like state)

## Test Coverage

Current test coverage:
- ✅ Database operations with empty data
- ✅ Database UPDATE operations and persistence
- ✅ API endpoints with empty database
- ✅ Creating first records
- ✅ Updating records (user profiles, entries, ELO)
- ✅ Querying empty data
- ✅ Edge cases and error handling
- ✅ Foreign key constraints and relationships
- ✅ Transactional operations

### Update Testing

The `database-updates.test.ts` file provides comprehensive testing for UPDATE operations:

**User Profile Updates:**
- Basic field updates (displayName, name, email, gender)
- Relationship updates (primaryClassId, gymId)
- Update persistence verification
- Multiple updates and latest value verification
- Edge cases (non-existent records, invalid enums, unique constraints)

**Entry Status Updates:**
- Status transitions (PENDING → APPROVED/REJECTED)
- Review metadata (reviewedAt, reviewedById, reviewNotes)
- Entry field updates (notes, value)

**ELO Updates:**
- UserClassElo updates and persistence
- Overall ELO updates
- Auto-updating timestamp fields

**Transactional Updates:**
- Multi-table updates in transactions
- Transaction rollback on errors
- Atomicity verification

Want to add more tests? See `__tests__/integration/` for examples!


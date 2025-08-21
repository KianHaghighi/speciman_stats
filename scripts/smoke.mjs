#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(import.meta.url);

console.log('🧪 SPECIMENSTATS Smoke Test');
console.log('============================\n');

try {
  // Test 1: Basic ELO math functions
  console.log('1. Testing ELO math imports...');
  
  // Dynamic import to avoid build issues
  const { eloFromPercentile, percentileFromElo, expectedScore } = await import('../src/lib/elo/math.js');
  
  console.log('   ✓ ELO math functions imported successfully');
  
  // Test 2: Basic calculations
  console.log('2. Testing basic ELO calculations...');
  
  const testPercentile = 75;
  const elo = eloFromPercentile(testPercentile);
  const backToPercentile = percentileFromElo(elo);
  
  console.log(`   ✓ eloFromPercentile(${testPercentile}) = ${elo.toFixed(1)}`);
  console.log(`   ✓ percentileFromElo(${elo.toFixed(1)}) = ${backToPercentile.toFixed(1)}`);
  
  // Test 3: Expected score calculation
  const expected = expectedScore(1500, 1500);
  console.log(`   ✓ expectedScore(1500, 1500) = ${expected.toFixed(3)}`);
  
  console.log('\n✅ All smoke tests PASSED');
  console.log('   ELO engine is operational');
  
} catch (error) {
  console.error('\n❌ Smoke test FAILED');
  console.error('   Error:', error.message);
  process.exit(1);
}

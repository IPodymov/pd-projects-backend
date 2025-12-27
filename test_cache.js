// Test script to verify cache configuration
const { createCache } = require('cache-manager');
const Keyv = require('keyv');
const KeyvRedis = require('@keyv/redis');

// Test 1: In-memory cache (should work)
console.log('Test 1: In-memory cache');
const memCache = createCache();
console.log('✓ In-memory cache created successfully');

// Test 2: Keyv with Redis (correct way for cache-manager v7)
console.log('\nTest 2: Keyv with Redis');
try {
  const redisKeyv = new Keyv({
    store: new KeyvRedis('redis://localhost:6379'),
    ttl: 5 * 60 * 1000,
  });
  
  const redisCache = createCache({
    stores: [redisKeyv],
  });
  console.log('✓ Redis cache configuration is correct');
} catch (e) {
  console.log('✗ Error:', e.message);
}

console.log('\nConfiguration syntax verified!');

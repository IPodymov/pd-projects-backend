// Test script to verify correct @keyv/redis import
const Keyv = require('keyv');
const KeyvRedis = require('@keyv/redis').default || require('@keyv/redis');

console.log('KeyvRedis:', typeof KeyvRedis);
console.log('KeyvRedis.default:', typeof KeyvRedis.default);

// Try both ways
try {
  const store = new KeyvRedis('redis://localhost:6379');
  console.log('✓ new KeyvRedis() works');
} catch (e) {
  console.log('✗ new KeyvRedis() failed:', e.message);
  try {
    const store = KeyvRedis('redis://localhost:6379');
    console.log('✓ KeyvRedis() without new works');
  } catch (e2) {
    console.log('✗ KeyvRedis() without new failed:', e2.message);
  }
}

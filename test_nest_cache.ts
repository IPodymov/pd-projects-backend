// Test NestJS cache configuration
import { createCache } from 'cache-manager';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

// Option 1: Use createCache with Keyv stores array
const redisKeyv = new Keyv({
  store: new KeyvRedis('redis://localhost:6379'),
  ttl: 5 * 60 * 1000,
});

const cache = createCache({
  stores: [redisKeyv],
});

console.log('Cache configuration test successful!');
console.log('Type of cache:', typeof cache);

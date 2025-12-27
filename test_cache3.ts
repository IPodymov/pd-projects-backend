import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

// This is how it should be used
const redisStore = new KeyvRedis('redis://localhost:6379');
const keyv = new Keyv({
  store: redisStore,
  ttl: 5 * 60 * 1000,
});

console.log('TypeScript import test passed');

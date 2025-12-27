const { createCache } = require('cache-manager');

async function testTTL() {
  const cache = createCache();
  
  // Test 1: set with TTL in milliseconds
  await cache.set('key1', 'value1', 5000);
  console.log('✓ Set with TTL in ms works');
  
  // Test 2: get
  const val = await cache.get('key1');
  console.log('✓ Get works, value:', val);
  
  // Test 3: del
  await cache.del('key1');
  console.log('✓ Del works');
  
  const val2 = await cache.get('key1');
  console.log('✓ After delete, value is:', val2);
}

testTTL().catch(console.error);

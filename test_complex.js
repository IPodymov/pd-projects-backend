const { createCache } = require('cache-manager');

async function testComplexObject() {
  const cache = createCache();
  
  // Simulate a TypeORM entity with relations
  const project = {
    id: 1,
    title: 'Test Project',
    author: {
      id: 1,
      name: 'John',
      roles: [{ value: 'ADMIN' }]
    },
    links: [
      { url: 'http://example.com', description: 'Link 1' }
    ],
    members: [
      { id: 2, name: 'Jane' }
    ]
  };
  
  // Test caching
  await cache.set('project:1', project, 5000);
  console.log('✓ Complex object cached');
  
  const cached = await cache.get('project:1');
  console.log('✓ Retrieved from cache');
  console.log('Cached object:', JSON.stringify(cached, null, 2));
  
  // Check if it's the same
  if (cached.id === project.id && cached.author.id === project.author.id) {
    console.log('✓ Object integrity maintained');
  } else {
    console.log('✗ Object integrity lost!');
  }
}

testComplexObject().catch(console.error);

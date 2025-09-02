// Quick test to set a driver location for testing distance display
// Run this in the browser console on the student dashboard

// Set a test driver location
const testLocation = {
  lat: 28.9954,
  lng: 77.6456,
  busId: '66d0123456a1b2c3d4e5f601',
  driverName: 'Test Driver',
  speed: 35,
  accuracy: 10,
  timestamp: new Date().toISOString(),
  source: 'test_simulation'
};

// Store the location for student to see
localStorage.setItem('latest_location_66d0123456a1b2c3d4e5f601', JSON.stringify(testLocation));
localStorage.setItem('last_known_driver_location_66d0123456a1b2c3d4e5f601', JSON.stringify(testLocation));

console.log('✅ Test driver location set at rohta bypass');
console.log('🔄 Refresh the student dashboard to see distance information');
console.log('📍 Expected: Distance to Current Stop ~0m, Distance to Next Stop ~4.1km');

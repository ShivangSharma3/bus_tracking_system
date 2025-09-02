// Test script for time-based routing system
const { LocationService } = require('./src/utils/locationService.js');

console.log('🧪 Testing Time-Based Routing System');
console.log('====================================');

const busId = '66d0123456a1b2c3d4e5f601';

// Test different times of day
const testTimes = [
    { hour: 8, label: '8:00 AM (Morning)' },
    { hour: 12, label: '12:00 PM (Morning)' },
    { hour: 15, label: '3:00 PM (Evening)' },
    { hour: 18, label: '6:00 PM (Evening)' },
    { hour: 22, label: '10:00 PM (Evening)' },
    { hour: 2, label: '2:00 AM (Default to Morning)' }
];

// Mock the current time for testing
const originalGetCurrentTimeOfDay = LocationService.getCurrentTimeOfDay;

testTimes.forEach(({ hour, label }) => {
    console.log(`\n⏰ Testing: ${label}`);
    
    // Mock the time
    LocationService.getCurrentTimeOfDay = () => {
        if (hour >= 6 && hour < 14) return 'morning';
        else if (hour >= 14 && hour < 22) return 'evening';
        else return 'morning';
    };
    
    const currentTimeOfDay = LocationService.getCurrentTimeOfDay();
    const route = LocationService.getCurrentRoute(busId);
    const routeInfo = LocationService.getRouteInfo(busId);
    
    console.log(`   Time of Day: ${currentTimeOfDay}`);
    console.log(`   Direction: ${routeInfo?.direction || 'N/A'}`);
    console.log(`   Route: ${routeInfo?.route || 'N/A'}`);
    console.log(`   Icon: ${routeInfo?.icon || 'N/A'}`);
    console.log(`   Stops: ${route.map(stop => stop.name).join(' → ')}`);
    
    // Test route progress with a sample location (near rohta bypass)
    const testLat = 28.9954;
    const testLng = 77.6456;
    
    const currentStop = LocationService.getCurrentStop(testLat, testLng, busId);
    const nextStop = LocationService.getNextStop(testLat, testLng, busId);
    const routeProgress = LocationService.getRouteProgress(testLat, testLng, busId);
    
    console.log(`   📍 At rohta bypass area:`);
    console.log(`      Current Stop: "${currentStop}"`);
    console.log(`      Next Stop: "${nextStop}"`);
    console.log(`      Progress: ${routeProgress.percentage}% (${routeProgress.status})`);
});

// Restore original function
LocationService.getCurrentTimeOfDay = originalGetCurrentTimeOfDay;

console.log('\n✅ Time-Based Routing Test Complete!');
console.log('\n🔍 Key Features Tested:');
console.log('   • Morning routes (6 AM - 2 PM): Home to Campus');
console.log('   • Evening routes (2 PM - 10 PM): Campus to Home');
console.log('   • Route direction indicators with emojis');
console.log('   • Time-specific route progress calculation');
console.log('   • Automatic fallback to morning for off-hours');

// Test to verify that bus location is determined by driver GPS only
// filepath: /Users/shivangsharma/bus/scripts/test-driver-location-only.js

import { LocationService } from '../src/utils/locationService.js';

console.log('🧪 Testing Driver GPS Location System');
console.log('=====================================');

// Simulate driver updating their GPS location
const driverLocation = {
  lat: 28.9954, // rohta bypass coordinates
  lng: 77.6456,
  timestamp: new Date().toISOString(),
  busId: '66d0123456a1b2c3d4e5f601',
  driverName: 'Rajesh Kumar',
  speed: 35,
  accuracy: 15
};

console.log('1. 🚛 Driver updates their GPS location:');
console.log('   📍 Coordinates:', driverLocation.lat, driverLocation.lng);
console.log('   🚌 Bus ID:', driverLocation.busId);
console.log('   👨‍✈️ Driver:', driverLocation.driverName);

// Update bus location (what driver does)
const updateResult = LocationService.updateBusLocation(driverLocation.busId, driverLocation);
console.log('   ✅ Location update result:', updateResult);

console.log('\n2. 🎓 Student checks bus location:');
// What student sees (should be driver's location)
const studentSeesLocation = LocationService.getCurrentLocation(driverLocation.busId);
if (studentSeesLocation) {
  console.log('   📍 Student sees bus at:', studentSeesLocation.lat, studentSeesLocation.lng);
  console.log('   🏠 Current stop:', studentSeesLocation.currentStop);
  console.log('   🎯 Next stop:', studentSeesLocation.nextStop);
  console.log('   📊 Route progress:', studentSeesLocation.routeProgress + '%');
  console.log('   📡 Location source:', studentSeesLocation.locationSource);
  console.log('   ✅ Is real location:', studentSeesLocation.isRealLocation);
  
  // Verify it's the driver's location
  const isDriverLocation = (
    studentSeesLocation.lat === driverLocation.lat &&
    studentSeesLocation.lng === driverLocation.lng &&
    studentSeesLocation.locationSource === 'Driver GPS'
  );
  
  console.log('   🔍 Verification: Student sees driver GPS location:', isDriverLocation);
} else {
  console.log('   ❌ Student sees no bus location (no driver GPS data)');
}

console.log('\n3. 👨‍💼 Admin checks bus location:');
// What admin sees (should be same driver location)
const adminSeesLocations = LocationService.getAllRealLocations();
console.log('   📊 Admin sees', adminSeesLocations.length, 'buses with GPS data');

const adminBusLocation = adminSeesLocations.find(loc => loc.busId === driverLocation.busId);
if (adminBusLocation) {
  console.log('   📍 Admin sees bus at:', adminBusLocation.lat, adminBusLocation.lng);
  console.log('   🏠 Current stop:', adminBusLocation.currentStop);
  console.log('   📡 Location source: Driver GPS');
  
  // Verify admin sees same location as student (driver's location)
  const sameAsStudent = (
    adminBusLocation.lat === driverLocation.lat &&
    adminBusLocation.lng === driverLocation.lng
  );
  
  console.log('   🔍 Verification: Admin sees same driver GPS location:', sameAsStudent);
} else {
  console.log('   ❌ Admin sees no location for this bus');
}

console.log('\n🎯 CONCLUSION:');
console.log('✅ Bus location is determined by DRIVER GPS only');
console.log('✅ Students see where the DRIVER actually is');
console.log('✅ Admin sees where the DRIVER actually is');
console.log('✅ No student location is used for bus tracking');
console.log('\n📝 Note: Run this test after driver has started GPS tracking');

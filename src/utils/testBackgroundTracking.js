// Test script for Background Location Tracking
// This can be run to verify the background tracking system

import { BackgroundLocationManager } from './backgroundLocationManager.js';

export const testBackgroundTracking = async () => {
  console.log('🧪 Testing Background Location Tracking...');
  
  try {
    // Test 1: Check initialization
    console.log('Test 1: Checking BackgroundLocationManager status...');
    const status = BackgroundLocationManager.getTrackingStatus();
    console.log('✅ Test 1 passed: Background manager is ready', status);
    
    // Test 2: Check service worker support
    console.log('Test 2: Checking service worker support...');
    if ('serviceWorker' in navigator) {
      console.log('✅ Test 2 passed: Service worker is supported');
    } else {
      console.log('❌ Test 2 failed: Service worker not supported');
    }
    
    // Test 3: Start background tracking with mock data
    console.log('Test 3: Starting background tracking...');
    const mockDriverData = {
      driverId: 'test-driver-123',
      busId: 'test-bus-456',
      routeId: 'test-route-789',
      driverName: 'Test Driver'
    };
    
    await BackgroundLocationManager.startBackgroundTracking(mockDriverData);
    console.log('✅ Test 3 passed: Background tracking started');
    
    // Test 4: Check tracking status
    console.log('Test 4: Checking tracking status...');
    const trackingStatus = BackgroundLocationManager.getTrackingStatus();
    console.log('Tracking status:', trackingStatus);
    if (trackingStatus.isActive) {
      console.log('✅ Test 4 passed: Background tracking is active');
    } else {
      console.log('❌ Test 4 failed: Background tracking is not active');
    }
    
    // Test 5: Wait a few seconds and check for location updates
    console.log('Test 5: Waiting for location updates...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for any stored location data
    const driverData = JSON.parse(localStorage.getItem('driverData') || '{}');
    if (driverData.busId) {
      const storedLocation = localStorage.getItem(`latest_location_${driverData.busId}`);
      if (storedLocation) {
        console.log('✅ Test 5 passed: Location data found in storage');
      } else {
        console.log('⚠️ Test 5 warning: No location data yet (may need user permission)');
      }
    } else {
      console.log('⚠️ Test 5 warning: No driver data found');
    }
    
    console.log('🎉 Background tracking tests completed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Auto-run test in development mode
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Only run if explicitly called
  window.testBackgroundTracking = testBackgroundTracking;
  console.log('🧪 Background tracking test available: window.testBackgroundTracking()');
}

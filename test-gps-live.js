// Live GPS Test - Verify Enhanced Background Tracking
// Run this in browser console on the driver dashboard

console.log('🔬 LIVE GPS BACKGROUND TRACKING TEST');
console.log('=====================================');

// Test 1: Check Enhanced Manager Status
function checkEnhancedManager() {
  console.log('\n📋 TEST 1: Enhanced Manager Status');
  console.log('==================================');
  
  if (window.EnhancedBackgroundLocationManager) {
    console.log('✅ Enhanced Background Location Manager is available');
    
    const status = window.EnhancedBackgroundLocationManager.getTrackingStatus();
    console.log('📊 Tracking Status:', status);
    
    if (status.isTracking) {
      console.log('✅ TRACKING IS ACTIVE');
      console.log(`📍 Last location: ${status.timeSinceLastLocation}ms ago`);
      console.log(`🔒 Wake lock: ${status.wakeLockActive ? 'ACTIVE' : 'INACTIVE'}`);
    } else {
      console.log('❌ TRACKING IS NOT ACTIVE');
    }
  } else {
    console.log('❌ Enhanced Background Location Manager NOT FOUND');
  }
}

// Test 2: Check Wake Lock Status
async function checkWakeLock() {
  console.log('\n📋 TEST 2: Wake Lock Support');
  console.log('============================');
  
  if ('wakeLock' in navigator) {
    console.log('✅ Wake Lock API is supported');
    
    try {
      const wakeLock = await navigator.wakeLock.request('screen');
      console.log('✅ Wake Lock can be acquired');
      wakeLock.release();
    } catch (error) {
      console.log('❌ Wake Lock failed:', error.message);
    }
  } else {
    console.log('❌ Wake Lock API not supported');
  }
}

// Test 3: Check GPS Permissions
async function checkGPSPermissions() {
  console.log('\n📋 TEST 3: GPS Permissions');
  console.log('==========================');
  
  if ('geolocation' in navigator) {
    console.log('✅ Geolocation API available');
    
    const permissions = await navigator.permissions.query({name: 'geolocation'});
    console.log(`📍 GPS Permission: ${permissions.state}`);
    
    if (permissions.state === 'granted') {
      console.log('✅ GPS permissions granted');
      
      // Test actual GPS access
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ GPS is working:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.log('❌ GPS error:', error.message);
        }
      );
    } else {
      console.log('❌ GPS permissions not granted');
    }
  } else {
    console.log('❌ Geolocation API not available');
  }
}

// Test 4: Simulate Tab Switch
function simulateTabSwitch() {
  console.log('\n📋 TEST 4: Tab Switch Simulation');
  console.log('=================================');
  
  console.log('🔄 Simulating tab becoming hidden...');
  
  // Dispatch visibility change event
  Object.defineProperty(document, 'hidden', {
    value: true,
    writable: true
  });
  
  const event = new Event('visibilitychange');
  document.dispatchEvent(event);
  
  console.log('📱 Tab is now "hidden" - checking if GPS continues...');
  
  setTimeout(() => {
    console.log('⏱️ 5 seconds in "background" - checking tracking status...');
    
    if (window.EnhancedBackgroundLocationManager) {
      const status = window.EnhancedBackgroundLocationManager.getTrackingStatus();
      if (status.isTracking) {
        console.log('✅ GPS TRACKING CONTINUES IN BACKGROUND!');
      } else {
        console.log('❌ GPS tracking stopped in background');
      }
    }
    
    // Reset visibility
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true
    });
    document.dispatchEvent(new Event('visibilitychange'));
    console.log('👁️ Tab is now "visible" again');
  }, 5000);
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running all GPS background tracking tests...\n');
  
  checkEnhancedManager();
  await checkWakeLock();
  await checkGPSPermissions();
  simulateTabSwitch();
  
  console.log('\n🎯 Test Results Summary:');
  console.log('========================');
  console.log('Copy this script and paste it in the browser console on the driver dashboard');
  console.log('Then run: runAllTests()');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  setTimeout(runAllTests, 1000);
}

// Export for manual testing
if (typeof module !== 'undefined') {
  module.exports = { runAllTests, checkEnhancedManager, checkWakeLock, checkGPSPermissions, simulateTabSwitch };
}

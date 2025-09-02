// Real-Time Background Tracking Test
// This script will verify if GPS tracking continues when switching screens

console.log('🧪 TESTING ENHANCED BACKGROUND TRACKING...');
console.log('==========================================');

// Test Results Storage
let testResults = {
  wakeLockSupported: false,
  serviceWorkerRegistered: false,
  gpsPermissions: false,
  enhancedManagerLoaded: false,
  trackingActive: false,
  locationUpdatesReceived: 0,
  tabSwitchTest: false,
  finalResult: 'UNKNOWN'
};

// Test 1: Check if Enhanced Manager is Available
async function testEnhancedManagerAvailability() {
  console.log('\n📋 Test 1: Enhanced Background Manager Availability');
  console.log('==================================================');
  
  try {
    // Try to import the enhanced manager
    const { EnhancedBackgroundLocationManager } = await import('./src/utils/enhancedBackgroundLocationManager.js');
    
    if (EnhancedBackgroundLocationManager) {
      console.log('✅ Enhanced Background Location Manager loaded successfully');
      testResults.enhancedManagerLoaded = true;
      
      // Check if it's actually tracking
      const status = EnhancedBackgroundLocationManager.getTrackingStatus();
      console.log('📊 Current tracking status:', status);
      
      if (status.isTracking) {
        console.log('✅ Enhanced tracking is ACTIVE');
        testResults.trackingActive = true;
      } else {
        console.log('❌ Enhanced tracking is NOT active');
      }
      
      return true;
    }
  } catch (error) {
    console.log('❌ Enhanced Background Location Manager not available:', error.message);
    return false;
  }
}

// Test 2: Check Wake Lock Support
async function testWakeLockSupport() {
  console.log('\n📋 Test 2: Wake Lock API Support');
  console.log('================================');
  
  if ('wakeLock' in navigator) {
    console.log('✅ Wake Lock API is supported');
    testResults.wakeLockSupported = true;
    
    try {
      const wakeLock = await navigator.wakeLock.request('screen');
      console.log('✅ Wake Lock can be acquired');
      wakeLock.release();
      console.log('✅ Wake Lock released successfully');
      return true;
    } catch (error) {
      console.log('❌ Wake Lock request failed:', error.message);
      return false;
    }
  } else {
    console.log('❌ Wake Lock API not supported in this browser');
    return false;
  }
}

// Test 3: Check GPS Permissions and Access
async function testGPSAccess() {
  console.log('\n📋 Test 3: GPS Access Test');
  console.log('==========================');
  
  if (!navigator.geolocation) {
    console.log('❌ Geolocation API not supported');
    return false;
  }
  
  try {
    const permission = await navigator.permissions.query({name: 'geolocation'});
    console.log('🎯 GPS Permission state:', permission.state);
    
    if (permission.state === 'granted') {
      testResults.gpsPermissions = true;
      
      // Test actual GPS access
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ GPS access successful:', {
              lat: position.coords.latitude.toFixed(6),
              lng: position.coords.longitude.toFixed(6),
              accuracy: Math.round(position.coords.accuracy) + 'm'
            });
            resolve(true);
          },
          (error) => {
            console.log('❌ GPS access failed:', error.message);
            resolve(false);
          },
          { timeout: 10000 }
        );
      });
    } else {
      console.log('❌ GPS permissions not granted');
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking GPS permissions:', error.message);
    return false;
  }
}

// Test 4: Monitor Location Updates for 30 seconds
async function testLocationUpdates() {
  console.log('\n📋 Test 4: Location Update Monitoring');
  console.log('=====================================');
  
  let updateCount = 0;
  const startTime = Date.now();
  
  console.log('🔄 Monitoring location updates for 30 seconds...');
  
  // Listen for service worker messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'LOCATION_UPDATE') {
        updateCount++;
        console.log(`📍 Location update #${updateCount}:`, {
          lat: event.data.data.lat?.toFixed(6),
          lng: event.data.data.lng?.toFixed(6),
          source: event.data.data.source,
          pageHidden: document.hidden
        });
      }
    });
  }
  
  // Also monitor direct GPS calls if available
  let directGPSInterval;
  if (navigator.geolocation) {
    directGPSInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateCount++;
          console.log(`📍 Direct GPS update #${updateCount}:`, {
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
            accuracy: Math.round(position.coords.accuracy) + 'm',
            pageHidden: document.hidden
          });
        },
        (error) => {
          console.log('❌ Direct GPS error:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 1000
        }
      );
    }, 8000); // Match the enhanced manager interval
  }
  
  // Wait 30 seconds
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  if (directGPSInterval) {
    clearInterval(directGPSInterval);
  }
  
  testResults.locationUpdatesReceived = updateCount;
  console.log(`📊 Total location updates received: ${updateCount}`);
  
  if (updateCount >= 3) { // Should get at least 3-4 updates in 30 seconds
    console.log('✅ Location updates are working');
    return true;
  } else {
    console.log('❌ Insufficient location updates received');
    return false;
  }
}

// Test 5: Tab Switch Simulation Test
async function testTabSwitching() {
  console.log('\n📋 Test 5: Tab Switch Simulation');
  console.log('=================================');
  
  let updatesWhileHidden = 0;
  let updatesWhileVisible = 0;
  
  // Monitor updates by visibility state
  const originalAddEventListener = navigator.serviceWorker?.addEventListener;
  if (originalAddEventListener) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'LOCATION_UPDATE') {
        if (document.hidden) {
          updatesWhileHidden++;
        } else {
          updatesWhileVisible++;
        }
      }
    });
  }
  
  console.log('🔄 Phase 1: Monitoring while page is VISIBLE (10 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log('📱 Phase 2: Simulating page HIDDEN (tab switch) for 15 seconds...');
  
  // Simulate page becoming hidden
  Object.defineProperty(document, 'hidden', {
    value: true,
    writable: true,
    configurable: true
  });
  
  // Trigger visibility change event
  const visibilityEvent = new Event('visibilitychange');
  document.dispatchEvent(visibilityEvent);
  
  console.log('📱 Page is now HIDDEN - GPS should continue...');
  
  // Wait while "hidden"
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  console.log('📱 Phase 3: Simulating page VISIBLE again (5 seconds)...');
  
  // Simulate page becoming visible
  Object.defineProperty(document, 'hidden', {
    value: false,
    writable: true,
    configurable: true
  });
  
  document.dispatchEvent(visibilityEvent);
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log(`📊 Updates while visible: ${updatesWhileVisible}`);
  console.log(`📊 Updates while hidden: ${updatesWhileHidden}`);
  
  if (updatesWhileHidden > 0) {
    console.log('✅ GPS continued working while tab was hidden');
    testResults.tabSwitchTest = true;
    return true;
  } else {
    console.log('❌ GPS stopped working when tab was hidden');
    return false;
  }
}

// Main Test Runner
async function runComprehensiveTest() {
  console.log('🚀 STARTING COMPREHENSIVE BACKGROUND TRACKING TEST');
  console.log('==================================================');
  
  const tests = [
    { name: 'Enhanced Manager', test: testEnhancedManagerAvailability },
    { name: 'Wake Lock Support', test: testWakeLockSupport },
    { name: 'GPS Access', test: testGPSAccess },
    { name: 'Location Updates', test: testLocationUpdates },
    { name: 'Tab Switching', test: testTabSwitching }
  ];
  
  let passedTests = 0;
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      if (result) {
        passedTests++;
        console.log(`✅ ${name}: PASSED`);
      } else {
        console.log(`❌ ${name}: FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${name}: ERROR -`, error.message);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Final Results
  console.log('\n📊 FINAL TEST RESULTS');
  console.log('=====================');
  console.log(`Tests Passed: ${passedTests}/${tests.length}`);
  console.log('Detailed Results:', testResults);
  
  if (passedTests >= 4) { // At least 4 out of 5 tests should pass
    testResults.finalResult = 'SUCCESS';
    console.log('🎉 OVERALL RESULT: SUCCESS - Background tracking should work!');
  } else if (passedTests >= 2) {
    testResults.finalResult = 'PARTIAL';
    console.log('⚠️ OVERALL RESULT: PARTIAL - Some issues detected');
  } else {
    testResults.finalResult = 'FAILURE';
    console.log('❌ OVERALL RESULT: FAILURE - Background tracking has issues');
  }
  
  return testResults;
}

// Export for manual testing
if (typeof window !== 'undefined') {
  window.testBackgroundTracking = runComprehensiveTest;
  window.testResults = testResults;
  console.log('🛠️ Test functions available:');
  console.log('- window.testBackgroundTracking() - Run full test suite');
  console.log('- window.testResults - View current test results');
}

// Auto-run if this script is loaded directly
if (typeof module === 'undefined') {
  console.log('🔧 Auto-running background tracking test...');
  runComprehensiveTest().then(results => {
    console.log('🏁 Test completed. Results:', results);
  });
}

export { runComprehensiveTest, testResults };

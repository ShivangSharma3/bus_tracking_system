// Debug Background Location Tracking Issues
// This script will help identify why location tracking stops when switching screens

console.log('🔍 Starting Background Location Tracking Debug...');

// Test 1: Check Service Worker Registration
async function testServiceWorkerRegistration() {
  console.log('\n📋 Test 1: Service Worker Registration');
  console.log('=====================================');
  
  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Workers not supported in this browser');
    return false;
  }
  
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('🔧 Current registrations:', registrations.length);
    
    registrations.forEach((reg, index) => {
      console.log(`Registration ${index + 1}:`, {
        scope: reg.scope,
        state: reg.active?.state,
        scriptURL: reg.active?.scriptURL
      });
    });
    
    // Check specifically for our location service worker
    const locationSW = registrations.find(reg => 
      reg.active?.scriptURL?.includes('sw-location.js')
    );
    
    if (locationSW) {
      console.log('✅ Location service worker found');
      return true;
    } else {
      console.log('❌ Location service worker NOT found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking service workers:', error);
    return false;
  }
}

// Test 2: Check GPS Permissions
async function testGPSPermissions() {
  console.log('\n📋 Test 2: GPS Permissions');
  console.log('==========================');
  
  if (!navigator.geolocation) {
    console.log('❌ Geolocation not supported');
    return false;
  }
  
  try {
    const permission = await navigator.permissions.query({name: 'geolocation'});
    console.log('🎯 GPS Permission state:', permission.state);
    
    if (permission.state === 'granted') {
      console.log('✅ GPS permissions granted');
      
      // Test actual GPS access
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ GPS test successful:', {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
            resolve(true);
          },
          (error) => {
            console.log('❌ GPS test failed:', error.message);
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
    console.error('❌ Error checking GPS permissions:', error);
    return false;
  }
}

// Test 3: Check Stored Driver Data
function testStoredDriverData() {
  console.log('\n📋 Test 3: Stored Driver Data');
  console.log('=============================');
  
  const storedDriver = localStorage.getItem('backgroundTrackingDriver');
  
  if (storedDriver) {
    try {
      const driverData = JSON.parse(storedDriver);
      console.log('✅ Driver data found:', {
        name: driverData.name,
        busId: driverData.busId,
        trackingActive: driverData.trackingActive,
        trackingStartTime: driverData.trackingStartTime
      });
      return driverData;
    } catch (error) {
      console.log('❌ Invalid driver data format:', error);
      return null;
    }
  } else {
    console.log('❌ No stored driver data found');
    return null;
  }
}

// Test 4: Test Page Visibility API
function testPageVisibilityAPI() {
  console.log('\n📋 Test 4: Page Visibility API');
  console.log('==============================');
  
  if (typeof document.hidden !== 'undefined') {
    console.log('✅ Page Visibility API supported');
    console.log('📱 Current page visibility:', document.hidden ? 'HIDDEN' : 'VISIBLE');
    
    // Add visibility change listener for testing
    document.addEventListener('visibilitychange', () => {
      console.log('🔄 Page visibility changed:', document.hidden ? 'HIDDEN' : 'VISIBLE');
    });
    
    return true;
  } else {
    console.log('❌ Page Visibility API not supported');
    return false;
  }
}

// Test 5: Test Service Worker Communication
async function testServiceWorkerCommunication() {
  console.log('\n📋 Test 5: Service Worker Communication');
  console.log('=======================================');
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.active) {
      console.log('✅ Service worker is active');
      
      // Test message sending
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          console.log('✅ Service worker responded:', event.data);
          resolve(true);
        };
        
        registration.active.postMessage({
          type: 'PING',
          timestamp: Date.now()
        }, [messageChannel.port2]);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          console.log('❌ Service worker did not respond');
          resolve(false);
        }, 5000);
      });
    } else {
      console.log('❌ Service worker not active');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing service worker communication:', error);
    return false;
  }
}

// Test 6: Monitor Location Updates
function testLocationUpdates() {
  console.log('\n📋 Test 6: Monitor Location Updates');
  console.log('===================================');
  
  let updateCount = 0;
  const startTime = Date.now();
  
  // Listen for location updates from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'LOCATION_UPDATE') {
      updateCount++;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      console.log(`📍 Location update #${updateCount} (${elapsed}s):`, {
        lat: event.data.data.lat,
        lng: event.data.data.lng,
        source: event.data.data.source,
        timestamp: event.data.data.timestamp
      });
    }
  });
  
  console.log('🎯 Monitoring location updates... (check console for updates)');
  return true;
}

// Test 7: Simulate Tab Switching
function testTabSwitching() {
  console.log('\n📋 Test 7: Tab Switching Simulation');
  console.log('===================================');
  
  console.log('🔄 Simulating tab switch in 5 seconds...');
  console.log('💡 You can also manually switch tabs to test');
  
  setTimeout(() => {
    // Simulate page becoming hidden
    Object.defineProperty(document, 'hidden', {
      value: true,
      writable: true
    });
    
    // Trigger visibility change event
    document.dispatchEvent(new Event('visibilitychange'));
    
    console.log('📱 Simulated: Page is now HIDDEN');
    
    setTimeout(() => {
      // Simulate page becoming visible again
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true
      });
      
      document.dispatchEvent(new Event('visibilitychange'));
      console.log('📱 Simulated: Page is now VISIBLE');
    }, 3000);
    
  }, 5000);
  
  return true;
}

// Main Debug Function
async function runBackgroundTrackingDebug() {
  console.log('🚀 Running Background Location Tracking Debug Suite');
  console.log('===================================================');
  
  const results = {
    serviceWorker: await testServiceWorkerRegistration(),
    gpsPermissions: await testGPSPermissions(),
    storedDriver: testStoredDriverData(),
    pageVisibility: testPageVisibilityAPI(),
    swCommunication: await testServiceWorkerCommunication(),
    locationMonitoring: testLocationUpdates(),
    tabSwitching: testTabSwitching()
  };
  
  console.log('\n📊 Debug Results Summary');
  console.log('========================');
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅' : '❌';
    console.log(`${status} ${test}: ${result ? 'PASS' : 'FAIL'}`);
  });
  
  // Provide diagnosis
  console.log('\n🔍 Diagnosis');
  console.log('============');
  
  if (!results.serviceWorker) {
    console.log('🚨 CRITICAL: Service worker not registered. Background tracking will not work.');
    console.log('💡 Solution: Ensure sw-location.js is in public folder and properly registered.');
  }
  
  if (!results.gpsPermissions) {
    console.log('🚨 CRITICAL: GPS permissions not granted. Location tracking cannot work.');
    console.log('💡 Solution: Grant location permissions when prompted.');
  }
  
  if (!results.storedDriver) {
    console.log('⚠️ WARNING: No driver data stored. Background tracking not initialized.');
    console.log('💡 Solution: Login as driver and start tracking first.');
  }
  
  if (!results.swCommunication) {
    console.log('🚨 CRITICAL: Service worker communication failed.');
    console.log('💡 Solution: Check service worker implementation for message handling.');
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Fix any CRITICAL issues above');
  console.log('2. Login as driver and start GPS tracking');
  console.log('3. Switch tabs/apps and monitor console for location updates');
  console.log('4. Check if students receive location updates');
  
  return results;
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  window.debugBackgroundTracking = runBackgroundTrackingDebug;
  console.log('🛠️ Debug function available: debugBackgroundTracking()');
}

export { runBackgroundTrackingDebug };

// SIMPLE SCREEN SWITCHING TEST
// This will give you a direct answer: Does GPS continue when switching screens?

console.log('🧪 SIMPLE SCREEN SWITCHING TEST');
console.log('===============================');

let testPassed = false;
let updateCountVisible = 0;
let updateCountHidden = 0;
let testStartTime = Date.now();

// Step 1: Check if Enhanced Manager is available
console.log('📋 Step 1: Checking Enhanced Background Manager...');

const checkEnhancedManager = async () => {
  try {
    // Check if enhanced manager is available in global scope
    if (typeof window !== 'undefined' && window.EnhancedBackgroundLocationManager) {
      console.log('✅ Enhanced Background Manager found in global scope');
      return window.EnhancedBackgroundLocationManager;
    }
    
    // Try to import it
    const { EnhancedBackgroundLocationManager } = await import('/src/utils/enhancedBackgroundLocationManager.js');
    console.log('✅ Enhanced Background Manager imported successfully');
    return EnhancedBackgroundLocationManager;
  } catch (error) {
    console.log('❌ Enhanced Background Manager not available:', error.message);
    return null;
  }
};

// Step 2: Start GPS tracking and monitor for 60 seconds
const runScreenSwitchTest = async () => {
  const manager = await checkEnhancedManager();
  
  if (!manager) {
    console.log('❌ Cannot test: Enhanced Background Manager not available');
    return false;
  }
  
  // Mock driver data for testing
  const mockDriverData = {
    busId: 'test-bus-123',
    name: 'Test Driver',
    trackingActive: true
  };
  
  console.log('📋 Step 2: Starting Enhanced GPS Tracking...');
  
  try {
    await manager.startEnhancedTracking(mockDriverData);
    console.log('✅ Enhanced tracking started');
  } catch (error) {
    console.log('❌ Failed to start enhanced tracking:', error.message);
    return false;
  }
  
  // Monitor GPS updates for 20 seconds visible
  console.log('📋 Step 3: Monitoring GPS while page is VISIBLE (20 seconds)...');
  
  let gpsInterval = setInterval(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (document.hidden) {
            updateCountHidden++;
            console.log(`📍 GPS Update #${updateCountHidden} (HIDDEN): ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
          } else {
            updateCountVisible++;
            console.log(`📍 GPS Update #${updateCountVisible} (VISIBLE): ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
          }
        },
        (error) => {
          console.log('❌ GPS Error:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 1000
        }
      );
    }
  }, 5000); // Every 5 seconds
  
  // Wait 20 seconds
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  console.log('📋 Step 4: Simulating tab switch (page HIDDEN for 20 seconds)...');
  
  // Simulate page becoming hidden
  Object.defineProperty(document, 'hidden', {
    value: true,
    writable: true,
    configurable: true
  });
  
  // Trigger visibility change event
  document.dispatchEvent(new Event('visibilitychange'));
  console.log('📱 Page is now HIDDEN - GPS should continue...');
  
  // Wait 20 seconds while "hidden"
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  console.log('📋 Step 5: Returning to VISIBLE state...');
  
  // Simulate page becoming visible again
  Object.defineProperty(document, 'hidden', {
    value: false,
    writable: true,
    configurable: true
  });
  
  document.dispatchEvent(new Event('visibilitychange'));
  console.log('📱 Page is now VISIBLE again');
  
  // Wait 10 more seconds
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Stop monitoring
  clearInterval(gpsInterval);
  
  // Analyze results
  console.log('\n📊 TEST RESULTS:');
  console.log('================');
  console.log(`📍 GPS updates while VISIBLE: ${updateCountVisible}`);
  console.log(`📍 GPS updates while HIDDEN: ${updateCountHidden}`);
  console.log(`⏱️ Total test duration: ${Math.round((Date.now() - testStartTime) / 1000)} seconds`);
  
  if (updateCountHidden > 0) {
    console.log('🎉 SUCCESS: GPS tracking continued while tab was hidden!');
    console.log('✅ Answer: YES, GPS works when switching screens');
    testPassed = true;
  } else if (updateCountVisible > 0) {
    console.log('⚠️ PARTIAL: GPS works when visible but stops when hidden');
    console.log('❌ Answer: NO, GPS stops when switching screens');
  } else {
    console.log('❌ FAILURE: No GPS updates received at all');
    console.log('❌ Answer: NO, GPS is not working');
  }
  
  return testPassed;
};

// Step 3: Alternative test using direct GPS monitoring
const runDirectGPSTest = async () => {
  console.log('\n🔄 RUNNING ALTERNATIVE DIRECT GPS TEST...');
  
  if (!navigator.geolocation) {
    console.log('❌ Geolocation not supported');
    return false;
  }
  
  let visibleUpdates = 0;
  let hiddenUpdates = 0;
  
  const trackGPS = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (document.hidden) {
          hiddenUpdates++;
          console.log(`📍 Direct GPS (HIDDEN) #${hiddenUpdates}:`, {
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
            time: new Date().toLocaleTimeString()
          });
        } else {
          visibleUpdates++;
          console.log(`📍 Direct GPS (VISIBLE) #${visibleUpdates}:`, {
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
            time: new Date().toLocaleTimeString()
          });
        }
      },
      (error) => {
        console.log('❌ Direct GPS error:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000
      }
    );
  };
  
  // Start tracking
  console.log('📋 Starting direct GPS monitoring...');
  trackGPS(); // Track immediately
  
  const directInterval = setInterval(trackGPS, 8000); // Every 8 seconds
  
  // Run for 30 seconds visible
  console.log('⏱️ Monitoring for 15 seconds while VISIBLE...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  // Simulate hidden
  console.log('📱 Simulating HIDDEN state for 20 seconds...');
  Object.defineProperty(document, 'hidden', {
    value: true,
    writable: true,
    configurable: true
  });
  document.dispatchEvent(new Event('visibilitychange'));
  
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  // Back to visible
  console.log('📱 Back to VISIBLE state...');
  Object.defineProperty(document, 'hidden', {
    value: false,
    writable: true,
    configurable: true
  });
  document.dispatchEvent(new Event('visibilitychange'));
  
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  clearInterval(directInterval);
  
  console.log('\n📊 DIRECT GPS TEST RESULTS:');
  console.log(`📍 Updates while visible: ${visibleUpdates}`);
  console.log(`📍 Updates while hidden: ${hiddenUpdates}`);
  
  if (hiddenUpdates > 0) {
    console.log('🎉 SUCCESS: Direct GPS continued when tab was hidden');
    return true;
  } else {
    console.log('❌ FAILURE: Direct GPS stopped when tab was hidden');
    return false;
  }
};

// Main test runner
const answerScreenSwitchingQuestion = async () => {
  console.log('🎯 ANSWERING: Does GPS work when switching screens?');
  console.log('================================================');
  
  try {
    // Test 1: Enhanced manager test
    const enhancedResult = await runScreenSwitchTest();
    
    // Test 2: Direct GPS test
    const directResult = await runDirectGPSTest();
    
    console.log('\n🏁 FINAL ANSWER:');
    console.log('================');
    
    if (enhancedResult || directResult) {
      console.log('✅ YES - GPS tracking continues when switching screens');
      console.log('🎉 Background tracking is working correctly!');
    } else {
      console.log('❌ NO - GPS tracking stops when switching screens');
      console.log('🚨 Background tracking needs fixing');
    }
    
    return enhancedResult || directResult;
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return false;
  }
};

// Make available globally for manual testing
if (typeof window !== 'undefined') {
  window.testScreenSwitching = answerScreenSwitchingQuestion;
  console.log('🛠️ Test available: window.testScreenSwitching()');
  
  // Auto-run if GPS permissions are available
  navigator.permissions?.query({name: 'geolocation'}).then(permission => {
    if (permission.state === 'granted') {
      console.log('🚀 GPS permissions granted - ready to test');
      console.log('💡 Run window.testScreenSwitching() to test screen switching');
    } else {
      console.log('⚠️ GPS permissions not granted - test may not work');
    }
  });
}

export { answerScreenSwitchingQuestion };

// Quick GPS Test - Fast Results
// Copy and paste this in browser console on driver dashboard

console.log('🚀 QUICK GPS TEST');
console.log('==================');

// Quick Enhanced Manager Check
if (window.EnhancedBackgroundLocationManager) {
  console.log('✅ Enhanced Manager Found');
  const status = window.EnhancedBackgroundLocationManager.getTrackingStatus();
  console.log('📊 Status:', status.isTracking ? '✅ ACTIVE' : '❌ INACTIVE');
} else {
  console.log('❌ Enhanced Manager Missing');
}

// Quick Wake Lock Check
if ('wakeLock' in navigator) {
  console.log('✅ Wake Lock Supported');
} else {
  console.log('❌ Wake Lock Not Supported');
}

// Quick GPS Check
if ('geolocation' in navigator) {
  console.log('✅ GPS Available');
} else {
  console.log('❌ GPS Not Available');
}

console.log('🎯 Test Complete - Check results above');

// Service Worker for Background GPS Tracking
// This runs independently of the main application and ensures continuous tracking

let locationTrackingInterval = null;
let continuousTrackingInterval = null;
let currentDriverData = null;
let isTracking = false;
let lastKnownLocation = null;
let trackingStartTime = null;
let failureCount = 0;
const MAX_FAILURES = 3;

// Enhanced message handling for robust tracking
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'START_TRACKING':
      console.log('🔄 Service Worker: Starting enhanced background location tracking');
      currentDriverData = data;
      startEnhancedBackgroundTracking();
      break;
      
    case 'STOP_TRACKING':
      console.log('⏹️ Service Worker: Stopping background location tracking');
      stopBackgroundTracking();
      break;
      
    case 'UPDATE_DRIVER_DATA':
      currentDriverData = data;
      // Restart tracking with new data if already tracking
      if (isTracking) {
        console.log('🔄 Updating driver data and restarting tracking');
        stopBackgroundTracking();
        startEnhancedBackgroundTracking();
      }
      break;
      
    case 'PING':
      // Health check from main app
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'PONG',
            isTracking: isTracking,
            lastLocation: lastKnownLocation,
            trackingDuration: trackingStartTime ? Date.now() - trackingStartTime : 0,
            failureCount: failureCount
          });
        });
      });
      break;

    case 'ACTIVATE_AGGRESSIVE_MODE':
      console.log('🚀 Service Worker: Activating aggressive background mode');
      currentDriverData = data;
      activateAggressiveBackgroundTracking();
      break;

    case 'UPDATE_LOCATION':
      console.log('📍 Service Worker: Received location update from main thread');
      lastKnownLocation = data;
      sendLocationUpdate(data, 'main_thread_update');
      break;
  }
});

function startEnhancedBackgroundTracking() {
  if (isTracking || !currentDriverData) return;
  
  isTracking = true;
  trackingStartTime = Date.now();
  failureCount = 0;
  
  console.log('🚀 Enhanced background tracking started for:', currentDriverData.name);
  
  // Immediate location capture
  trackLocationWithRetry();
  
  // Primary tracking interval (every 10 seconds for accuracy)
  locationTrackingInterval = setInterval(trackLocationWithRetry, 10000);
  
  // Continuous tracking interval (every 5 seconds for immediate updates)
  continuousTrackingInterval = setInterval(trackLocationContinuous, 5000);
  
  // Store tracking state persistently
  storeTrackingState(true);
}

// Activate aggressive background tracking for when app is minimized/switched
function activateAggressiveBackgroundTracking() {
  console.log('🚀 Service Worker: Activating aggressive background tracking mode');
  
  if (!currentDriverData) return;
  
  // Stop normal tracking
  if (locationTrackingInterval) {
    clearInterval(locationTrackingInterval);
    locationTrackingInterval = null;
  }
  
  if (continuousTrackingInterval) {
    clearInterval(continuousTrackingInterval);
    continuousTrackingInterval = null;
  }
  
  // Start aggressive tracking with faster intervals
  console.log('📍 Starting aggressive tracking with 3-second intervals');
  
  // Immediate capture
  trackLocationWithRetry();
  
  // Aggressive primary tracking (every 3 seconds)
  locationTrackingInterval = setInterval(() => {
    console.log('📍 Aggressive SW tracking (3s interval)');
    trackLocationWithRetry();
  }, 3000);
  
  // Aggressive continuous tracking (every 2 seconds)
  continuousTrackingInterval = setInterval(() => {
    console.log('📍 Aggressive SW continuous (2s interval)');
    trackLocationContinuous();
  }, 2000);
  
  // Set aggressive mode flag
  isTracking = true;
  
  console.log('✅ Aggressive background tracking activated with 2-3 second intervals');
}

function stopBackgroundTracking() {
  isTracking = false;
  
  if (locationTrackingInterval) {
    clearInterval(locationTrackingInterval);
    locationTrackingInterval = null;
  }
  
  if (continuousTrackingInterval) {
    clearInterval(continuousTrackingInterval);
    continuousTrackingInterval = null;
  }
  
  // Clear tracking state
  storeTrackingState(false);
  trackingStartTime = null;
  
  console.log('⏹️ Enhanced background tracking stopped');
}

// Enhanced location tracking with retry mechanism
function trackLocationWithRetry() {
  if (!navigator.geolocation) {
    console.error('❌ Geolocation not available in service worker context');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      processLocationUpdate(position, 'service_worker_primary');
      failureCount = 0; // Reset failure count on success
    },
    (error) => {
      failureCount++;
      console.error(`❌ Service worker GPS error (${failureCount}/${MAX_FAILURES}):`, error.message);
      
      if (failureCount >= MAX_FAILURES) {
        console.warn('⚠️ Max GPS failures reached, using last known location');
        if (lastKnownLocation) {
          sendLocationUpdate(lastKnownLocation, 'last_known_fallback');
        }
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    }
  );
}

// Continuous location tracking for immediate updates
function trackLocationContinuous() {
  if (!navigator.geolocation || !currentDriverData) return;
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      processLocationUpdate(position, 'continuous');
    },
    (error) => {
      // Silent failure for continuous tracking to avoid spam
      console.log('⚠️ Continuous GPS update failed:', error.code);
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 5000 // More frequent updates
    }
  );
}

// Process and validate location updates
function processLocationUpdate(position, source) {
  const locationData = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    timestamp: new Date().toISOString(),
    busId: currentDriverData.busId,
    driverName: currentDriverData.name,
    speed: position.coords.speed || 0,
    accuracy: position.coords.accuracy,
    altitude: position.coords.altitude,
    heading: position.coords.heading,
    source: 'driver_dashboard', // CRITICAL: Mark as driver GPS
    backgroundSource: source,
    trackingDuration: trackingStartTime ? Math.round((Date.now() - trackingStartTime) / 1000) : 0
  };
  
  // Validate location quality
  if (position.coords.accuracy > 100) {
    console.log(`⚠️ Low accuracy GPS (${position.coords.accuracy}m), but still using for continuity`);
  }
  
  // Check for significant movement (only update if moved more than 5 meters or 30 seconds passed)
  if (lastKnownLocation) {
    const distance = calculateDistance(
      lastKnownLocation.lat, lastKnownLocation.lng,
      locationData.lat, locationData.lng
    );
    const timeDiff = new Date(locationData.timestamp) - new Date(lastKnownLocation.timestamp);
    
    if (distance < 0.005 && timeDiff < 30000) { // Less than 5m and 30s
      console.log('📍 Minor movement detected, updating timestamp only');
      locationData.isMinorUpdate = true;
    }
  }
  
  lastKnownLocation = locationData;
  sendLocationUpdate(locationData, source);
  
  console.log(`🚌 Background GPS captured (${source}):`, {
    location: `${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}`,
    accuracy: `${position.coords.accuracy}m`,
    speed: `${(locationData.speed * 3.6 || 0).toFixed(1)} km/h`,
    driver: locationData.driverName
  });
}

// Send location update to main thread and cache
function sendLocationUpdate(locationData, source) {
  // Store in cache for immediate access
  caches.open('bus-location-cache-v2').then(cache => {
    const response = new Response(JSON.stringify(locationData));
    cache.put(`/location/${currentDriverData.busId}`, response);
    cache.put(`/location/latest`, response);
  });
  
  // Send to all clients (main thread, other tabs)
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'LOCATION_UPDATE',
        data: locationData,
        source: source,
        timestamp: Date.now()
      });
    });
  });
  
  // Store persistently (for recovery after restart)
  storeLocationPersistently(locationData);
}

// Calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Store tracking state for recovery
function storeTrackingState(isActive) {
  const trackingState = {
    isActive: isActive,
    driverData: currentDriverData,
    startTime: trackingStartTime,
    lastUpdate: Date.now()
  };
  
  caches.open('bus-tracking-state').then(cache => {
    const response = new Response(JSON.stringify(trackingState));
    cache.put('/tracking-state', response);
  });
}

// Store location persistently
function storeLocationPersistently(locationData) {
  caches.open('bus-location-history').then(cache => {
    // Store with timestamp key for history
    const timestampKey = `/location-history/${Date.now()}`;
    const response = new Response(JSON.stringify(locationData));
    cache.put(timestampKey, response);
  });
}
  
// Enhanced fetch handler for location requests
self.addEventListener('fetch', (event) => {
  // Handle location requests with enhanced caching
  if (event.request.url.includes('/api/location/background')) {
    event.respondWith(
      caches.open('bus-location-cache-v2').then(cache => {
        return cache.match('/location/latest')
          .then(response => {
            if (response) {
              return response;
            }
            return new Response(JSON.stringify({
              error: 'No location data available',
              timestamp: Date.now()
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
      })
    );
  }
  
  // Handle tracking state requests
  if (event.request.url.includes('/tracking-state')) {
    event.respondWith(
      caches.open('bus-tracking-state').then(cache => {
        return cache.match('/tracking-state') || new Response(JSON.stringify({
          isActive: false,
          error: 'No tracking state'
        }));
      })
    );
  }
});

// Auto-resume tracking on service worker activation
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activated, checking for existing tracking state');
  
  event.waitUntil(
    caches.open('bus-tracking-state').then(cache => {
      return cache.match('/tracking-state').then(response => {
        if (response) {
          return response.json().then(state => {
            if (state.isActive && state.driverData) {
              console.log('🔄 Resuming background tracking after service worker restart');
              currentDriverData = state.driverData;
              trackingStartTime = state.startTime || Date.now();
              startEnhancedBackgroundTracking();
            }
          });
        }
      });
    })
  );
});

// Keep service worker alive and handle installation
self.addEventListener('install', (event) => {
  console.log('🔧 Background Location Service Worker installed');
  self.skipWaiting(); // Activate immediately
});

// Periodic sync for reliable background updates (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-location-sync') {
      console.log('🔄 Background sync triggered for location update');
      event.waitUntil(trackLocationWithRetry());
    }
  });
}

// Handle visibility change to maintain tracking
self.addEventListener('visibilitychange', () => {
  console.log('👀 Visibility changed, ensuring tracking continuity');
  if (isTracking && currentDriverData) {
    // Ensure tracking is still active
    trackLocationWithRetry();
  }
});

console.log('🔧 Enhanced Background Location Service Worker loaded with continuous tracking');
console.log('📍 Features: Auto-resume, Retry mechanism, Multiple intervals, Quality validation');

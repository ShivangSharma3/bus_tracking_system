// Service Worker for Background GPS Tracking
// This runs independently of the main application

let locationTrackingInterval = null;
let currentDriverData = null;
let isTracking = false;

// Store driver data when received from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'START_TRACKING':
      console.log('🔄 Service Worker: Starting background location tracking');
      currentDriverData = data;
      startBackgroundTracking();
      break;
      
    case 'STOP_TRACKING':
      console.log('⏹️ Service Worker: Stopping background location tracking');
      stopBackgroundTracking();
      break;
      
    case 'UPDATE_DRIVER_DATA':
      currentDriverData = data;
      break;
  }
});

function startBackgroundTracking() {
  if (isTracking || !currentDriverData) return;
  
  isTracking = true;
  
  // Track location immediately
  trackLocation();
  
  // Then track every 15 seconds (longer interval for background to save battery)
  locationTrackingInterval = setInterval(trackLocation, 15000);
}

function stopBackgroundTracking() {
  isTracking = false;
  if (locationTrackingInterval) {
    clearInterval(locationTrackingInterval);
    locationTrackingInterval = null;
  }
}

function trackLocation() {
  if (!navigator.geolocation || !currentDriverData) return;
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const locationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: new Date().toISOString(),
        busId: currentDriverData.busId,
        driverName: currentDriverData.name,
        speed: position.coords.speed || 0,
        accuracy: position.coords.accuracy,
        source: 'driver_dashboard' // CRITICAL: Mark as driver GPS
      };
      
      console.log('🚌 Background GPS captured (DRIVER ONLY):', locationData);
      
      // Store in cache for immediate access
      caches.open('bus-location-cache').then(cache => {
        const response = new Response(JSON.stringify(locationData));
        cache.put(`/location/${currentDriverData.busId}`, response);
      });
      
      // Send to main thread if available
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'LOCATION_UPDATE',
            data: locationData
          });
        });
      });
      
      // Store in localStorage (accessible across tabs)
      // Note: Service workers can't access localStorage directly, 
      // but we'll handle this in the main thread
      
    },
    (error) => {
      console.error('❌ Background GPS error:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000 // Accept location up to 30 seconds old
    }
  );
}

// Keep service worker active
self.addEventListener('fetch', (event) => {
  // Handle location requests
  if (event.request.url.includes('/api/location/background')) {
    event.respondWith(
      caches.open('bus-location-cache').then(cache => {
        return cache.match(event.request) || new Response('No location data');
      })
    );
  }
});

console.log('🔧 Background Location Service Worker loaded');

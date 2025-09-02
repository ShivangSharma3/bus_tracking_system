// Service Worker for Background GPS Tracking
// This runs independently of the main application
// NOTE: Service workers cannot access navigator.geolocation directly
// They receive location data from the main thread and handle persistence

let currentDriverData = null;
let isTracking = false;
let lastLocationData = null;
let persistenceInterval = null;

// Store driver data when received from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  console.log('🔄 Service Worker received message:', type);
  
  switch (type) {
    case 'START_TRACKING':
      console.log('🔄 Service Worker: Starting background location persistence');
      currentDriverData = data;
      startBackgroundPersistence();
      break;
      
    case 'STOP_TRACKING':
      console.log('⏹️ Service Worker: Stopping background location persistence');
      stopBackgroundPersistence();
      break;
      
    case 'UPDATE_DRIVER_DATA':
      currentDriverData = data;
      break;
      
    case 'LOCATION_DATA':
      // Receive location data from main thread
      console.log('📍 Service Worker: Received location data from main thread');
      lastLocationData = data;
      handleLocationData(data);
      break;
      
    case 'PING':
      // Health check from main thread
      console.log('🏓 Service Worker: Ping received');
      respondToClient(event, { type: 'PONG', timestamp: Date.now() });
      break;
  }
});

function startBackgroundPersistence() {
  if (isTracking || !currentDriverData) return;
  
  isTracking = true;
  console.log('✅ Service Worker: Background persistence started');
  
  // Set up periodic backend sync (every 30 seconds)
  persistenceInterval = setInterval(() => {
    if (lastLocationData && currentDriverData) {
      console.log('🔄 Service Worker: Syncing location to backend');
      sendLocationToBackend(lastLocationData);
    }
  }, 30000);
}

function stopBackgroundPersistence() {
  isTracking = false;
  if (persistenceInterval) {
    clearInterval(persistenceInterval);
    persistenceInterval = null;
  }
  console.log('⏹️ Service Worker: Background persistence stopped');
}

function handleLocationData(locationData) {
  if (!locationData || !currentDriverData) return;
function handleLocationData(locationData) {
  if (!locationData || !currentDriverData) return;
  
  // Store the latest location
  lastLocationData = {
    ...locationData,
    timestamp: new Date().toISOString()
  };
  
  // Store in cache for immediate access
  cacheLocationData(lastLocationData);
  
  // Send to backend immediately
  sendLocationToBackend(lastLocationData);
  
  // Notify all clients
  notifyClients({
    type: 'LOCATION_UPDATE',
    data: lastLocationData
  });
}

async function cacheLocationData(locationData) {
  try {
    const cache = await caches.open('bus-location-cache');
    const response = new Response(JSON.stringify(locationData));
    await cache.put(`/location/${currentDriverData.busId}`, response);
    console.log('💾 Service Worker: Location cached');
  } catch (error) {
    console.error('❌ Service Worker: Cache error:', error);
  }
}

async function sendLocationToBackend(locationData) {
  try {
    const backendUrl = 'https://bus-tracking-system-4.onrender.com';
    const response = await fetch(`${backendUrl}/api/location/update-location/${currentDriverData.busId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(locationData)
    });
    
    if (response.ok) {
      console.log('✅ Service Worker: Location sent to backend successfully');
    } else {
      console.log('⚠️ Service Worker: Backend response not OK:', response.status);
    }
  } catch (error) {
    console.log('⚠️ Service Worker: Backend request failed:', error.message);
  }
}

function notifyClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}

function respondToClient(event, message) {
  // Send response back to specific client
  event.ports[0]?.postMessage(message);
}

// Keep service worker active
self.addEventListener('fetch', (event) => {
  // Handle location cache requests
  if (event.request.url.includes('/api/location/background')) {
    event.respondWith(
      caches.open('bus-location-cache').then(cache => {
        return cache.match(event.request) || new Response('No location data');
      })
    );
  }
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing location service worker');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Location service worker activated');
  event.waitUntil(self.clients.claim());
});

console.log('🔧 Background Location Service Worker loaded (Fixed Version)');

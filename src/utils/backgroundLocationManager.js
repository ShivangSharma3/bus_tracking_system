// Background Location Manager
// Handles persistent GPS tracking across page navigation and logout

export class BackgroundLocationManager {
  static isServiceWorkerSupported = 'serviceWorker' in navigator;
  static serviceWorkerRegistration = null;
  static locationWatchId = null;
  static trackingInterval = null;
  static isBackgroundTracking = false;
  
  // Initialize background tracking
  static async initialize() {
    console.log('🚀 Initializing Background Location Manager');
    
    if (this.isServiceWorkerSupported) {
      try {
        // Register service worker
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw-location.js');
        console.log('✅ Background location service worker registered');
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        
        // Listen for location updates from service worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
        
        // Check if driver is already logged in and start tracking
        const driverData = this.getStoredDriverData();
        if (driverData && driverData.busId && driverData.trackingActive) {
          console.log('🔄 Resuming background tracking for stored driver:', driverData.name);
          await this.startBackgroundTracking(driverData);
        }
        
      } catch (error) {
        console.error('❌ Service worker registration failed:', error);
        // Fallback to regular tracking
        this.initializeFallbackTracking();
      }
    } else {
      console.log('⚠️ Service workers not supported, using fallback tracking');
      this.initializeFallbackTracking();
    }
  }
  
  // Handle messages from service worker
  static handleServiceWorkerMessage(event) {
    const { type, data } = event.data;
    
    if (type === 'LOCATION_UPDATE') {
      console.log('📍 Received location update from service worker:', data);
      // Save the location data received from service worker
      this.saveLocationDataFromServiceWorker(data);
    }
  }
  
  // Save location data received from service worker
  static async saveLocationDataFromServiceWorker(locationData) {
    try {
      // Import LocationService to enhance the data
      const { LocationService } = await import('./locationService.js');
      
      // Save using LocationService which handles validation and enhancement
      await LocationService.saveRealLocation(locationData);
      
      console.log('✅ Service worker location data processed and saved');
    } catch (error) {
      console.error('❌ Error processing service worker location:', error);
    }
  }
  
  // Start background GPS tracking
  static async startBackgroundTracking(driverData) {
    if (!driverData || !driverData.busId) {
      console.error('❌ Cannot start tracking: Invalid driver data');
      return;
    }
    
    console.log(`🔄 Starting background tracking for driver: ${driverData.name} (Bus: ${driverData.busId})`);
    
    // Store driver data persistently
    this.storeDriverData(driverData);
    
    if (this.serviceWorkerRegistration) {
      // Use service worker for background tracking
      this.serviceWorkerRegistration.active?.postMessage({
        type: 'START_TRACKING',
        data: driverData
      });
    }
    
    // Also start foreground tracking as backup
    this.startForegroundTracking(driverData);
    this.isBackgroundTracking = true;
    
    // Set up page visibility handling
    this.setupVisibilityHandling();
  }
  
  // Stop background tracking
  static stopBackgroundTracking() {
    console.log('⏹️ Stopping background location tracking');
    
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.active?.postMessage({
        type: 'STOP_TRACKING'
      });
    }
    
    this.stopForegroundTracking();
    this.isBackgroundTracking = false;
    
    // Clear stored driver data
    this.clearStoredDriverData();
  }
  
  // Fallback tracking for browsers without service worker support
  static initializeFallbackTracking() {
    console.log('🔄 Initializing fallback tracking without service worker');
    
    // Check for stored driver data and resume tracking
    const driverData = this.getStoredDriverData();
    if (driverData && driverData.trackingActive) {
      console.log('🔄 Resuming fallback tracking for:', driverData.name);
      this.startForegroundTracking(driverData);
      this.setupVisibilityHandling();
    }
    
    // Set up periodic check to ensure tracking continues
    setInterval(() => {
      const currentDriverData = this.getStoredDriverData();
      if (currentDriverData && currentDriverData.trackingActive && !this.trackingInterval) {
        console.log('🔄 Restarting tracking interval (fallback)');
        this.startForegroundTracking(currentDriverData);
      }
    }, 30000); // Check every 30 seconds
  }
  
  // Enhanced foreground tracking with better error handling
  static startForegroundTracking(driverData) {
    if (this.trackingInterval) {
      console.log('📍 Foreground tracking already active');
      return; // Already tracking
    }
    
    console.log('🔄 Starting foreground GPS tracking for:', driverData.name);
    
    const trackLocation = () => {
      if (!navigator.geolocation) {
        console.error('❌ Geolocation not supported');
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
            busId: driverData.busId,
            driverName: driverData.name,
            speed: position.coords.speed || 0,
            accuracy: position.coords.accuracy,
            source: 'driver_dashboard' // CRITICAL: Mark as driver GPS
          };
          
          console.log('📍 Foreground GPS captured (Driver Only):', locationData);
          
          // Save location data locally
          this.saveLocationData(locationData);
          
          // Send to service worker for persistence and backend sync
          if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
            this.serviceWorkerRegistration.active.postMessage({
              type: 'LOCATION_DATA',
              data: locationData
            });
          }
        },
        (error) => {
          console.error('❌ Foreground GPS error:', error);
          // Try to restart tracking after error
          setTimeout(() => {
            const currentDriverData = this.getStoredDriverData();
            if (currentDriverData && currentDriverData.trackingActive) {
              console.log('🔄 Restarting tracking after GPS error');
              this.startForegroundTracking(currentDriverData);
            }
          }, 10000);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    };
    
    // Track immediately
    trackLocation();
    
    // Track every 10 seconds
    this.trackingInterval = setInterval(trackLocation, 10000);
    console.log('✅ Foreground tracking interval started');
  }
  
  static stopForegroundTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    
    if (this.locationWatchId) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
  }
  
  // Handle page visibility changes
  static setupVisibilityHandling() {
    // Handle page visibility changes (tab switching)
    document.addEventListener('visibilitychange', () => {
      const driverData = this.getStoredDriverData();
      if (!driverData || !driverData.trackingActive) return;
      
      if (document.hidden) {
        console.log('📱 Page hidden - GPS continues via foreground tracking with service worker persistence');
        // Continue foreground tracking but ensure service worker is active for persistence
        if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
          this.serviceWorkerRegistration.active.postMessage({
            type: 'START_TRACKING',
            data: driverData
          });
          console.log('🔄 Service worker persistence activated');
        }
      } else {
        console.log('📱 Page visible - ensuring foreground tracking continues');
        // Ensure foreground tracking is active
        if (!this.trackingInterval) {
          this.startForegroundTracking(driverData);
        }
        
        // Keep service worker active for backup
        if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
          this.serviceWorkerRegistration.active.postMessage({
            type: 'START_TRACKING',
            data: driverData
          });
        }
      }
    });
    
    // Handle page unload (user closes tab or navigates away)
    window.addEventListener('beforeunload', () => {
      const driverData = this.getStoredDriverData();
      if (driverData && driverData.trackingActive && this.serviceWorkerRegistration) {
        console.log('🚪 Page unloading - ensuring service worker continues');
        if (this.serviceWorkerRegistration.active) {
          this.serviceWorkerRegistration.active.postMessage({
            type: 'START_TRACKING',
            data: driverData
          });
        }
      }
    });
    
    // Handle app switching on mobile (iOS/Android)
    window.addEventListener('pagehide', () => {
      const driverData = this.getStoredDriverData();
      if (driverData && driverData.trackingActive && this.serviceWorkerRegistration) {
        console.log('📱 App switching - maintaining foreground GPS tracking');
        // Keep foreground tracking active since service worker can't access GPS
      }
    });
    
    // Handle app resuming on mobile
    window.addEventListener('pageshow', () => {
      const driverData = this.getStoredDriverData();
      if (driverData && driverData.trackingActive) {
        console.log('📱 App resumed - ensuring tracking continues');
        // Ensure foreground tracking is active
        if (!this.trackingInterval) {
          this.startForegroundTracking(driverData);
        }
      }
    });
  }
  
  // Store driver data persistently
  static storeDriverData(driverData) {
    localStorage.setItem('backgroundTrackingDriver', JSON.stringify({
      ...driverData,
      trackingStartTime: new Date().toISOString(),
      trackingActive: true
    }));
  }
  
  // Get stored driver data
  static getStoredDriverData() {
    try {
      const stored = localStorage.getItem('backgroundTrackingDriver');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading stored driver data:', error);
      return null;
    }
  }
  
  // Clear stored driver data
  static clearStoredDriverData() {
    localStorage.removeItem('backgroundTrackingDriver');
  }
  
  // Save location data with enhanced storage
  static async saveLocationData(locationData) {
    try {
      // Calculate route information
      const enhancedLocationData = await this.enhanceLocationData(locationData);
      
      // Store latest location
      localStorage.setItem(`latest_location_${locationData.busId}`, JSON.stringify(enhancedLocationData));
      
      // Store in history
      const historyKey = `location_history_${locationData.busId}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      history.unshift(enhancedLocationData);
      
      // Keep only last 50 locations
      if (history.length > 50) {
        history.splice(50);
      }
      
      localStorage.setItem(historyKey, JSON.stringify(history));
      
      // Try to send to backend
      this.sendToBackend(enhancedLocationData);
      
      console.log('💾 Location saved successfully');
      
    } catch (error) {
      console.error('❌ Error saving location:', error);
    }
  }
  
  // Enhance location data with route information
  static async enhanceLocationData(locationData) {
    // Import LocationService dynamically to avoid circular dependencies
    const { LocationService } = await import('./locationService.js');
    
    const routeProgress = LocationService.getRouteProgress(locationData.lat, locationData.lng, locationData.busId);
    const currentStop = LocationService.getCurrentStop(locationData.lat, locationData.lng, locationData.busId);
    const nextStop = LocationService.getNextStop(locationData.lat, locationData.lng, locationData.busId);
    const busInfo = LocationService.busInfo[locationData.busId] || {};
    
    return {
      ...locationData,
      busNumber: busInfo.busNumber || `BUS-${locationData.busId.slice(-3)}`,
      route: busInfo.route || 'Unknown Route',
      currentStop: currentStop,
      nextStop: nextStop,
      routeProgress: routeProgress.percentage,
      progressStatus: routeProgress.status,
      distanceToCurrentStop: routeProgress.distanceToCurrentStop,
      distanceToNextStop: routeProgress.distanceToNextStop,
      lastUpdated: new Date().toISOString()
    };
  }
  
  // Send location to backend
  static async sendToBackend(locationData) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    if (!backendUrl || backendUrl === 'undefined') {
      console.log('ℹ️ Backend URL not configured, using localStorage only');
      return;
    }
    
    try {
      const response = await fetch(`${backendUrl}/api/location/update-location/${locationData.busId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData)
      });
      
      if (response.ok) {
        console.log('✅ Location sent to backend successfully');
      } else {
        console.log('⚠️ Backend response not OK:', response.status);
      }
    } catch (error) {
      console.log('⚠️ Backend request failed:', error.message);
    }
  }
  
  // Handle messages from service worker
  static handleServiceWorkerMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'LOCATION_UPDATE':
        console.log('📍 Location update from service worker:', data);
        this.saveLocationData(data);
        break;
    }
  }
  
  // Fallback tracking for unsupported browsers
  static initializeFallbackTracking() {
    console.log('🔄 Initializing fallback location tracking');
    
    const driverData = this.getStoredDriverData();
    if (driverData && driverData.busId) {
      this.startForegroundTracking(driverData);
    }
  }
  
  // Check if tracking is active
  static isTrackingActive() {
    const driverData = this.getStoredDriverData();
    return driverData && driverData.trackingActive;
  }
  
  // Resume tracking after page reload
  static resumeTrackingIfNeeded() {
    const driverData = this.getStoredDriverData();
    if (driverData && driverData.trackingActive) {
      console.log('🔄 Resuming background tracking after page reload');
      this.startBackgroundTracking(driverData);
    }
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      BackgroundLocationManager.initialize();
    });
  } else {
    BackgroundLocationManager.initialize();
  }
}

// Enhanced Background Location Manager with Wake Lock
// This ensures GPS tracking continues even when switching tabs/apps

export class EnhancedBackgroundLocationManager {
  static wakeLock = null;
  static trackingInterval = null;
  static isTracking = false;
  static currentDriverData = null;
  static lastLocationTime = 0;
  static serviceWorkerRegistration = null;
  static visibilityHandlerAdded = false;
  
  // Initialize the enhanced background tracking
  static async initialize() {
    console.log('🚀 Initializing Enhanced Background Location Manager');
    
    // Register service worker for persistence
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw-location.js');
        console.log('✅ Service worker registered for persistence');
        await navigator.serviceWorker.ready;
      } catch (error) {
        console.log('⚠️ Service worker registration failed, using fallback');
      }
    }
    
    // Check for stored driver data and resume
    const driverData = this.getStoredDriverData();
    if (driverData && driverData.trackingActive) {
      console.log('🔄 Resuming enhanced tracking for:', driverData.name);
      await this.startEnhancedTracking(driverData);
    }
  }
  
  // Start enhanced background tracking
  static async startEnhancedTracking(driverData) {
    if (!driverData || !driverData.busId) {
      console.error('❌ Cannot start tracking: Invalid driver data');
      return;
    }
    
    console.log(`🔄 Starting enhanced tracking for driver: ${driverData.name}`);
    
    this.currentDriverData = driverData;
    this.storeDriverData(driverData);
    
    // Request wake lock to prevent screen sleep
    await this.requestWakeLock();
    
    // Start continuous GPS tracking
    this.startContinuousTracking();
    
    // Setup visibility handling (only once)
    if (!this.visibilityHandlerAdded) {
      this.setupEnhancedVisibilityHandling();
      this.visibilityHandlerAdded = true;
    }
    
    // Notify service worker
    if (this.serviceWorkerRegistration?.active) {
      this.serviceWorkerRegistration.active.postMessage({
        type: 'START_TRACKING',
        data: driverData
      });
    }
    
    this.isTracking = true;
    console.log('✅ Enhanced background tracking started');
  }
  
  // Stop enhanced tracking
  static stopEnhancedTracking() {
    console.log('⏹️ Stopping enhanced background tracking');
    
    this.isTracking = false;
    this.stopContinuousTracking();
    this.releaseWakeLock();
    
    // Notify service worker
    if (this.serviceWorkerRegistration?.active) {
      this.serviceWorkerRegistration.active.postMessage({
        type: 'STOP_TRACKING'
      });
    }
    
    this.clearStoredDriverData();
    console.log('✅ Enhanced tracking stopped');
  }
  
  // Request screen wake lock to prevent device sleep
  static async requestWakeLock() {
    if (!('wakeLock' in navigator)) {
      console.log('⚠️ Wake Lock API not supported');
      return;
    }
    
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      console.log('🔒 Wake lock acquired - screen will stay active');
      
      this.wakeLock.addEventListener('release', () => {
        console.log('🔓 Wake lock released');
        // Try to reacquire if still tracking
        if (this.isTracking) {
          setTimeout(() => this.requestWakeLock(), 1000);
        }
      });
    } catch (error) {
      console.log('❌ Wake lock request failed:', error);
    }
  }
  
  // Release wake lock
  static releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
      console.log('🔓 Wake lock released manually');
    }
  }
  
  // Start continuous GPS tracking
  static startContinuousTracking() {
    if (this.trackingInterval) {
      console.log('📍 Tracking already active');
      return;
    }
    
    console.log('🔄 Starting continuous GPS tracking');
    
    const trackLocation = () => {
      if (!this.isTracking || !this.currentDriverData) return;
      
      if (!navigator.geolocation) {
        console.error('❌ Geolocation not supported');
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const now = Date.now();
          this.lastLocationTime = now;
          
          const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
            busId: this.currentDriverData.busId,
            driverName: this.currentDriverData.name,
            speed: position.coords.speed || 0,
            accuracy: position.coords.accuracy,
            source: 'driver_dashboard',
            pageHidden: document.hidden,
            trackingMode: 'enhanced'
          };
          
          console.log(`📍 GPS Update (${document.hidden ? 'BACKGROUND' : 'FOREGROUND'}):`, {
            lat: locationData.lat,
            lng: locationData.lng,
            accuracy: locationData.accuracy
          });
          
          // Save locally
          this.saveLocationData(locationData);
          
          // Send to service worker for backend sync
          if (this.serviceWorkerRegistration?.active) {
            this.serviceWorkerRegistration.active.postMessage({
              type: 'LOCATION_DATA',
              data: locationData
            });
          }
        },
        (error) => {
          console.error('❌ GPS error:', error);
          // Continue tracking despite errors
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000 // Accept location up to 5 seconds old
        }
      );
    };
    
    // Track immediately
    trackLocation();
    
    // Continue tracking every 8 seconds
    this.trackingInterval = setInterval(trackLocation, 8000);
    console.log('✅ Continuous tracking started (8-second intervals)');
  }
  
  // Stop continuous tracking
  static stopContinuousTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      console.log('⏹️ Continuous tracking stopped');
    }
  }
  
  // Enhanced visibility handling
  static setupEnhancedVisibilityHandling() {
    console.log('🔄 Setting up enhanced visibility handling');
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!this.isTracking) return;
      
      if (document.hidden) {
        console.log('📱 Page hidden - GPS tracking continues in background');
        // Keep tracking active but log for monitoring
        console.log('🔄 Background mode: GPS tracking active');
        
        // Ensure wake lock is active
        if (!this.wakeLock) {
          this.requestWakeLock();
        }
      } else {
        console.log('📱 Page visible - GPS tracking continues in foreground');
        
        // Ensure tracking is still active
        if (!this.trackingInterval && this.isTracking) {
          console.log('🔄 Restarting tracking after page became visible');
          this.startContinuousTracking();
        }
      }
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      if (this.isTracking) {
        console.log('🚪 Page unloading - GPS tracking should continue');
        // Store current state
        localStorage.setItem('enhancedTrackingState', JSON.stringify({
          isTracking: this.isTracking,
          driverData: this.currentDriverData,
          lastLocationTime: this.lastLocationTime
        }));
      }
    });
    
    // Handle page show (for mobile apps returning from background)
    window.addEventListener('pageshow', (event) => {
      if (event.persisted && this.isTracking) {
        console.log('📱 Page restored from cache - ensuring tracking continues');
        if (!this.trackingInterval) {
          this.startContinuousTracking();
        }
      }
    });
    
    // Handle focus events
    window.addEventListener('focus', () => {
      if (this.isTracking && !this.trackingInterval) {
        console.log('🔄 Window focused - restarting tracking if needed');
        this.startContinuousTracking();
      }
    });
    
    // Handle blur events
    window.addEventListener('blur', () => {
      if (this.isTracking) {
        console.log('📱 Window blurred - tracking continues');
      }
    });
  }
  
  // Save location data with enhanced storage
  static async saveLocationData(locationData) {
    try {
      // Import LocationService dynamically
      const { LocationService } = await import('./locationService.js');
      
      // Save using LocationService
      await LocationService.saveRealLocation(locationData);
      
      // Store latest location for persistence
      localStorage.setItem(`latest_location_${locationData.busId}`, JSON.stringify(locationData));
      
      console.log('💾 Location saved successfully');
    } catch (error) {
      console.error('❌ Error saving location:', error);
    }
  }
  
  // Store driver data persistently
  static storeDriverData(driverData) {
    localStorage.setItem('enhancedTrackingDriver', JSON.stringify({
      ...driverData,
      trackingStartTime: new Date().toISOString(),
      trackingActive: true,
      enhancedMode: true
    }));
  }
  
  // Get stored driver data
  static getStoredDriverData() {
    try {
      const stored = localStorage.getItem('enhancedTrackingDriver');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading stored driver data:', error);
      return null;
    }
  }
  
  // Clear stored driver data
  static clearStoredDriverData() {
    localStorage.removeItem('enhancedTrackingDriver');
    localStorage.removeItem('enhancedTrackingState');
  }
  
  // Check if tracking is active
  static isTrackingActive() {
    return this.isTracking;
  }
  
  // Get tracking status
  static getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      hasWakeLock: !!this.wakeLock,
      driverData: this.currentDriverData,
      lastLocationTime: this.lastLocationTime,
      timeSinceLastLocation: this.lastLocationTime ? Date.now() - this.lastLocationTime : null
    };
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    EnhancedBackgroundLocationManager.initialize();
  });
}

// Enhanced Background Location Manager with Service Worker Integration
// Ensures continuous GPS tracking even when driver switches to other apps/tabs

class BackgroundLocationManager {
  constructor() {
    this.serviceWorkerRegistration = null;
    this.isBackgroundTrackingActive = false;
    this.healthCheckInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.webWorker = null;
    this.fallbackInterval = null;
    
    // Initialize immediately
    this.init();
  }

  async init() {
    console.log('🔧 Initializing Enhanced Background Location Manager');
    
    try {
      // Register service worker for background tracking
      await this.registerServiceWorker();
      
      // Setup health monitoring
      this.setupHealthMonitoring();
      
      // Setup visibility change handler
      this.setupVisibilityHandler();
      
      // Setup page unload handler
      this.setupUnloadHandler();
      
      // Check for auto-resume on page load
      this.checkAutoResume();
      
      console.log('✅ Enhanced Background Location Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Background Location Manager:', error);
      // Fallback to Web Worker if Service Worker fails
      this.setupWebWorkerFallback();
    }
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw-location.js', {
          scope: '/'
        });
        
        console.log('🔄 Service Worker registered for background GPS tracking');
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        
        return this.serviceWorkerRegistration;
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
        throw error;
      }
    } else {
      throw new Error('Service Worker not supported');
    }
  }

  handleServiceWorkerMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'LOCATION_UPDATE':
        console.log('📍 Background location update received:', data);
        // Forward to main app if needed
        window.dispatchEvent(new CustomEvent('backgroundLocationUpdate', { detail: data }));
        break;
        
      case 'TRACKING_ERROR':
        console.warn('⚠️ Background tracking error:', data);
        this.handleTrackingError(data);
        break;
        
      case 'PONG':
        // Health check response
        console.log('💓 Background tracking health check OK');
        this.reconnectAttempts = 0; // Reset on successful ping
        break;
        
      default:
        console.log('📨 Unknown message from service worker:', type, data);
    }
  }

  setupHealthMonitoring() {
    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
        this.serviceWorkerRegistration.active.postMessage({ type: 'PING' });
      }
    }, 30000);
  }

  setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('📱 App went to background - Enhanced tracking ensures continuity');
        // Ensure service worker tracking is active
        this.ensureBackgroundTracking();
      } else {
        console.log('👀 App came to foreground - Verifying background tracking status');
        // Verify tracking is still active
        this.verifyTrackingStatus();
      }
    });
  }

  setupUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      // Store state for auto-resume
      if (this.isBackgroundTrackingActive) {
        const driverData = JSON.parse(localStorage.getItem('driverData') || '{}');
        if (driverData.busId) {
          localStorage.setItem('backgroundTrackingState', JSON.stringify({
            active: true,
            timestamp: Date.now(),
            driverData: driverData
          }));
        }
      }
    });
  }

  checkAutoResume() {
    try {
      const trackingState = localStorage.getItem('backgroundTrackingState');
      if (trackingState) {
        const state = JSON.parse(trackingState);
        
        // Auto-resume if less than 5 minutes since last session
        if (state.active && (Date.now() - state.timestamp) < 300000) {
          console.log('🔄 Auto-resuming background tracking from previous session');
          this.startBackgroundTracking(state.driverData);
        }
        
        // Clean up old state
        localStorage.removeItem('backgroundTrackingState');
      }
    } catch (error) {
      console.error('Error checking auto-resume:', error);
    }
  }

  async startBackgroundTracking(driverData) {
    if (!driverData || !driverData.busId) {
      console.error('❌ Cannot start background tracking: Invalid driver data');
      return false;
    }

    console.log('🚀 Starting enhanced background location tracking for:', driverData.name);

    try {
      if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
        // Send start command to service worker
        this.serviceWorkerRegistration.active.postMessage({
          type: 'START_TRACKING',
          data: driverData
        });
        
        this.isBackgroundTrackingActive = true;
        
        // Store driver data for auto-resume
        localStorage.setItem('driverData', JSON.stringify(driverData));
        
        console.log('✅ Enhanced background tracking started successfully');
        return true;
      } else {
        console.warn('⚠️ Service Worker not ready, using fallback');
        this.setupWebWorkerFallback(driverData);
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to start background tracking:', error);
      this.setupWebWorkerFallback(driverData);
      return false;
    }
  }

  async stopBackgroundTracking() {
    console.log('⏹️ Stopping enhanced background location tracking');

    try {
      if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
        this.serviceWorkerRegistration.active.postMessage({
          type: 'STOP_TRACKING'
        });
      }
      
      // Clear health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }
      
      // Stop Web Worker fallback if active
      if (this.webWorker) {
        this.webWorker.terminate();
        this.webWorker = null;
      }
      
      if (this.fallbackInterval) {
        clearInterval(this.fallbackInterval);
        this.fallbackInterval = null;
      }
      
      this.isBackgroundTrackingActive = false;
      
      // Clean up stored state
      localStorage.removeItem('backgroundTrackingState');
      
      console.log('✅ Enhanced background tracking stopped');
      return true;
    } catch (error) {
      console.error('❌ Error stopping background tracking:', error);
      return false;
    }
  }

  setupWebWorkerFallback(driverData) {
    console.log('🔄 Setting up Web Worker fallback for background tracking');
    
    try {
      // Create inline Web Worker for fallback
      const workerCode = `
        let trackingInterval = null;
        let driverData = null;
        
        self.onmessage = function(e) {
          const { type, data } = e.data;
          
          if (type === 'START_TRACKING') {
            driverData = data;
            if (trackingInterval) clearInterval(trackingInterval);
            
            trackingInterval = setInterval(() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const location = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                      timestamp: new Date().toISOString(),
                      busId: driverData.busId,
                      driverName: driverData.name,
                      source: 'web_worker_fallback'
                    };
                    
                    self.postMessage({ type: 'LOCATION_UPDATE', data: location });
                  },
                  (error) => {
                    self.postMessage({ type: 'ERROR', data: error.message });
                  },
                  { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
                );
              }
            }, 10000);
          } else if (type === 'STOP_TRACKING') {
            if (trackingInterval) {
              clearInterval(trackingInterval);
              trackingInterval = null;
            }
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.webWorker = new Worker(workerUrl);
      
      this.webWorker.onmessage = (e) => {
        const { type, data } = e.data;
        if (type === 'LOCATION_UPDATE') {
          console.log('📍 Web Worker location update:', data);
          // Save location via LocationService
          import('./locationService.js').then(({ LocationService }) => {
            LocationService.saveRealLocation(data);
          });
        }
      };
      
      if (driverData) {
        this.webWorker.postMessage({ type: 'START_TRACKING', data: driverData });
      }
      
      this.isBackgroundTrackingActive = true;
      console.log('✅ Web Worker fallback activated');
      
    } catch (error) {
      console.error('❌ Web Worker fallback failed, using basic interval:', error);
      this.setupBasicFallback(driverData);
    }
  }

  setupBasicFallback(driverData) {
    console.log('🔄 Setting up basic interval fallback');
    
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
    }
    
    this.fallbackInterval = setInterval(() => {
      if (navigator.geolocation && driverData) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: new Date().toISOString(),
              busId: driverData.busId,
              driverName: driverData.name,
              source: 'basic_fallback'
            };
            
            console.log('📍 Basic fallback location:', location);
            
            // Save location
            import('./locationService.js').then(({ LocationService }) => {
              LocationService.saveRealLocation(location);
            });
          },
          (error) => {
            console.error('Basic fallback GPS error:', error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );
      }
    }, 15000); // Every 15 seconds for basic fallback
    
    this.isBackgroundTrackingActive = true;
  }

  ensureBackgroundTracking() {
    if (this.isBackgroundTrackingActive && this.serviceWorkerRegistration) {
      const driverData = JSON.parse(localStorage.getItem('driverData') || '{}');
      if (driverData.busId) {
        this.serviceWorkerRegistration.active.postMessage({
          type: 'UPDATE_DRIVER_DATA',
          data: driverData
        });
      }
    }
  }

  verifyTrackingStatus() {
    if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
      this.serviceWorkerRegistration.active.postMessage({ type: 'PING' });
    }
  }

  handleTrackingError(error) {
    console.warn('🔄 Handling tracking error, attempting recovery:', error);
    
    this.reconnectAttempts++;
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        const driverData = JSON.parse(localStorage.getItem('driverData') || '{}');
        if (driverData.busId) {
          this.startBackgroundTracking(driverData);
        }
      }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    }
  }

  getTrackingStatus() {
    return {
      isActive: this.isBackgroundTrackingActive,
      hasServiceWorker: !!this.serviceWorkerRegistration,
      hasWebWorker: !!this.webWorker,
      hasFallback: !!this.fallbackInterval,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const backgroundLocationManager = new BackgroundLocationManager();

export { backgroundLocationManager as BackgroundLocationManager };
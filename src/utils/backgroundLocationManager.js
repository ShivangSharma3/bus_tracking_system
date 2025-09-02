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
    this.aggressiveWebWorker = null;
    this.persistentTrackingInterval = null;

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
    // Enhanced visibility change handling for aggressive background scenarios
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('📱 App went to background - Enhanced tracking ensures continuity');
        // Ensure service worker tracking is active
        this.ensureBackgroundTracking();
        // Force immediate tracking update before going background
        this.forceImmediateTracking();
      } else {
        console.log('👀 App came to foreground - Verifying background tracking status');
        // Verify tracking is still active
        this.verifyTrackingStatus();
      }
    });

    // Additional mobile-specific event listeners for better background handling
    window.addEventListener('pagehide', () => {
      console.log('📱 Page hide event - Ensuring background tracking continues');
      this.ensureBackgroundTracking();
      this.forceImmediateTracking();
    });

    window.addEventListener('pageshow', () => {
      console.log('📱 Page show event - Verifying tracking status');
      this.verifyTrackingStatus();
    });

    // Handle focus/blur events for additional reliability
    window.addEventListener('blur', () => {
      console.log('📱 Window blur - App losing focus, ensuring background tracking');
      setTimeout(() => {
        this.ensureBackgroundTracking();
        this.forceImmediateTracking();
      }, 100);
    });

    window.addEventListener('focus', () => {
      console.log('📱 Window focus - App regaining focus, verifying tracking');
      setTimeout(() => {
        this.verifyTrackingStatus();
      }, 100);
    });

    // Handle mobile orientation change which can affect background behavior
    window.addEventListener('orientationchange', () => {
      console.log('📱 Orientation change - Ensuring tracking continuity');
      setTimeout(() => {
        this.ensureBackgroundTracking();
      }, 500);
    });

    // Enhanced background detection for iOS Safari and mobile browsers
    if ('onpagehide' in window) {
      // Modern browsers
      window.addEventListener('pagehide', (e) => {
        console.log('📱 Modern pagehide - Aggressive background tracking activation');
        this.activateAggressiveBackgroundMode();
      });
    }

    // Detect when app goes to background on mobile
    document.addEventListener('pause', () => {
      console.log('📱 Mobile pause event - Activating background mode');
      this.activateAggressiveBackgroundMode();
    }, false);

    document.addEventListener('resume', () => {
      console.log('📱 Mobile resume event - Verifying tracking status');
      this.verifyTrackingStatus();
    }, false);
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
      // Stop aggressive mode if active
      this.deactivateAggressiveMode();

      // Stop service worker tracking
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

      if (this.aggressiveWebWorker) {
        this.aggressiveWebWorker.terminate();
        this.aggressiveWebWorker = null;
      }

      if (this.persistentTrackingInterval) {
        clearInterval(this.persistentTrackingInterval);
        this.persistentTrackingInterval = null;
      }
      
      this.isBackgroundTrackingActive = false;
      
      // Clean up stored state
      localStorage.removeItem('backgroundTrackingState');
      localStorage.removeItem('aggressiveBackgroundMode');
      
      console.log('✅ Enhanced background tracking stopped completely');
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

  // Force immediate GPS tracking before going to background
  forceImmediateTracking() {
    const driverData = JSON.parse(localStorage.getItem('driverData') || '{}');
    if (driverData.busId) {
      console.log('📍 Forcing immediate GPS capture before background');
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: new Date().toISOString(),
              busId: driverData.busId,
              driverName: driverData.name,
              source: 'pre_background_capture',
              speed: position.coords.speed || 0,
              accuracy: position.coords.accuracy
            };

            console.log('📍 Pre-background location captured:', location);
            
            // Save immediately to localStorage and try backend
            import('./locationService.js').then(({ LocationService }) => {
              LocationService.saveRealLocation(location);
            });

            // Update service worker with fresh location
            if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
              this.serviceWorkerRegistration.active.postMessage({
                type: 'UPDATE_LOCATION',
                data: location
              });
            }
          },
          (error) => {
            console.warn('⚠️ Pre-background GPS capture failed:', error.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      }
    }
  }

  // Activate aggressive background tracking mode
  activateAggressiveBackgroundMode() {
    console.log('🚀 Activating aggressive background tracking mode');
    
    const driverData = JSON.parse(localStorage.getItem('driverData') || '{}');
    if (!driverData.busId) return;

    // 1. Ensure service worker is actively tracking
    if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
      this.serviceWorkerRegistration.active.postMessage({
        type: 'ACTIVATE_AGGRESSIVE_MODE',
        data: driverData
      });
    }

    // 2. Start aggressive Web Worker fallback
    this.startAggressiveWebWorkerTracking(driverData);

    // 3. Store background activation state
    localStorage.setItem('aggressiveBackgroundMode', JSON.stringify({
      active: true,
      timestamp: Date.now(),
      driverData: driverData
    }));

    // 4. Set up persistent interval tracking
    this.setupPersistentTracking(driverData);
  }

  // Start aggressive Web Worker tracking for background scenarios
  startAggressiveWebWorkerTracking(driverData) {
    if (this.aggressiveWebWorker) {
      this.aggressiveWebWorker.terminate();
    }

    try {
      const workerCode = `
        let aggressiveTrackingInterval = null;
        let driverData = null;
        
        self.onmessage = function(e) {
          const { type, data } = e.data;
          
          if (type === 'START_AGGRESSIVE_TRACKING') {
            driverData = data;
            console.log('🚀 Aggressive Web Worker tracking started');
            
            if (aggressiveTrackingInterval) clearInterval(aggressiveTrackingInterval);
            
            // Track every 5 seconds in aggressive mode
            aggressiveTrackingInterval = setInterval(() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const location = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                      timestamp: new Date().toISOString(),
                      busId: driverData.busId,
                      driverName: driverData.name,
                      source: 'aggressive_web_worker',
                      speed: position.coords.speed || 0,
                      accuracy: position.coords.accuracy
                    };
                    
                    self.postMessage({ type: 'AGGRESSIVE_LOCATION_UPDATE', data: location });
                  },
                  (error) => {
                    self.postMessage({ type: 'AGGRESSIVE_ERROR', data: error.message });
                  },
                  { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
                );
              }
            }, 5000); // Every 5 seconds for aggressive tracking
            
          } else if (type === 'STOP_AGGRESSIVE_TRACKING') {
            if (aggressiveTrackingInterval) {
              clearInterval(aggressiveTrackingInterval);
              aggressiveTrackingInterval = null;
            }
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.aggressiveWebWorker = new Worker(workerUrl);

      this.aggressiveWebWorker.onmessage = (e) => {
        const { type, data } = e.data;
        if (type === 'AGGRESSIVE_LOCATION_UPDATE') {
          console.log('📍 Aggressive Web Worker location:', data);
          
          // Save location immediately
          import('./locationService.js').then(({ LocationService }) => {
            LocationService.saveRealLocation(data);
          });

          // Store in localStorage for immediate access
          localStorage.setItem(`latest_location_${data.busId}`, JSON.stringify(data));
        }
      };

      // Start aggressive tracking
      this.aggressiveWebWorker.postMessage({ 
        type: 'START_AGGRESSIVE_TRACKING', 
        data: driverData 
      });

      console.log('✅ Aggressive Web Worker tracking activated');

    } catch (error) {
      console.error('❌ Aggressive Web Worker failed:', error);
    }
  }

  // Setup persistent tracking that survives background mode
  setupPersistentTracking(driverData) {
    if (this.persistentTrackingInterval) {
      clearInterval(this.persistentTrackingInterval);
    }

    // Persistent tracking every 8 seconds
    this.persistentTrackingInterval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: new Date().toISOString(),
              busId: driverData.busId,
              driverName: driverData.name,
              source: 'persistent_background_tracking',
              speed: position.coords.speed || 0,
              accuracy: position.coords.accuracy
            };

            console.log('📍 Persistent background location:', location);

            // Save location with multiple fallbacks
            import('./locationService.js').then(({ LocationService }) => {
              LocationService.saveRealLocation(location);
            });

            // Store in localStorage immediately
            localStorage.setItem(`latest_location_${location.busId}`, JSON.stringify(location));
            localStorage.setItem(`last_known_driver_location_${location.busId}`, JSON.stringify(location));

            // Update service worker if available
            if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
              this.serviceWorkerRegistration.active.postMessage({
                type: 'UPDATE_LOCATION',
                data: location
              });
            }
          },
          (error) => {
            console.warn('⚠️ Persistent tracking GPS error:', error.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      }
    }, 8000); // Every 8 seconds for persistent tracking

    console.log('✅ Persistent background tracking activated');
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
      hasAggressiveMode: !!this.aggressiveWebWorker,
      hasPersistentTracking: !!this.persistentTrackingInterval,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Cleanup aggressive tracking when returning to foreground
  deactivateAggressiveMode() {
    console.log('🔄 Deactivating aggressive background mode');
    
    // Stop aggressive Web Worker
    if (this.aggressiveWebWorker) {
      this.aggressiveWebWorker.postMessage({ type: 'STOP_AGGRESSIVE_TRACKING' });
      this.aggressiveWebWorker.terminate();
      this.aggressiveWebWorker = null;
    }

    // Stop persistent tracking
    if (this.persistentTrackingInterval) {
      clearInterval(this.persistentTrackingInterval);
      this.persistentTrackingInterval = null;
    }

    // Clear aggressive mode state
    localStorage.removeItem('aggressiveBackgroundMode');

    // Return service worker to normal mode
    if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
      const driverData = JSON.parse(localStorage.getItem('driverData') || '{}');
      if (driverData.busId) {
        this.serviceWorkerRegistration.active.postMessage({
          type: 'START_TRACKING',
          data: driverData
        });
      }
    }

    console.log('✅ Returned to normal background tracking mode');
  }
}

// Create singleton instance
const backgroundLocationManager = new BackgroundLocationManager();

export { backgroundLocationManager as BackgroundLocationManager };
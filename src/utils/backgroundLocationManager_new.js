// Enhanced Background Location Manager
// Ensures continuous GPS tracking even when driver switches apps or tabs

import { LocationService } from './locationService.js';

export class BackgroundLocationManager {
  static isServiceWorkerSupported = 'serviceWorker' in navigator;
  static serviceWorkerRegistration = null;
  static locationWatchId = null;
  static trackingInterval = null;
  static healthCheckInterval = null;
  static isBackgroundTracking = false;
  static reconnectAttempts = 0;
  static maxReconnectAttempts = 5;
  static lastLocationUpdate = null;
  
  // Initialize enhanced background tracking system
  static async initialize() {
    console.log('🚀 Initializing Enhanced Background Location Manager');
    
    if (this.isServiceWorkerSupported) {
      try {
        // Register enhanced service worker
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw-location.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        
        console.log('✅ Enhanced background location service worker registered');
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        
        // Set up message handling
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
        
        // Set up health monitoring
        this.setupHealthMonitoring();
        
        // Handle page visibility changes
        this.setupVisibilityHandler();
        
        // Auto-resume tracking if driver was already tracking
        await this.checkAndResumeTracking();
        
      } catch (error) {
        console.error('❌ Service worker registration failed:', error);
        this.initializeFallbackTracking();
      }
    } else {
      console.log('⚠️ Service workers not supported, using enhanced fallback tracking');
      this.initializeFallbackTracking();
    }
  }
  
  // Setup health monitoring for service worker
  static setupHealthMonitoring() {
    this.healthCheckInterval = setInterval(() => {
      if (this.isBackgroundTracking && this.serviceWorkerRegistration?.active) {
        this.serviceWorkerRegistration.active.postMessage({ type: 'PING' });
      }
    }, 30000); // Check every 30 seconds
  }
  
  // Handle page visibility changes to maintain tracking
  static setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      const driverData = this.getStoredDriverData();
      
      if (document.hidden) {
        console.log('📱 App backgrounded - ensuring continuous tracking');
        if (driverData && driverData.trackingActive) {
          this.ensureBackgroundTracking(driverData);
        }
      } else {
        console.log('📱 App foregrounded - verifying tracking status');
        if (driverData && driverData.trackingActive) {
          this.verifyTrackingStatus();
        }
      }
    });
    
    // Handle beforeunload to ensure tracking continues
    window.addEventListener('beforeunload', () => {
      const driverData = this.getStoredDriverData();
      if (driverData && driverData.trackingActive) {
        console.log('🔄 Page unloading - background tracking will continue');
        this.ensureBackgroundTracking(driverData);
      }
    });
  }
  
  // Check and resume tracking if needed
  static async checkAndResumeTracking() {
    const driverData = this.getStoredDriverData();
    if (driverData && driverData.busId && driverData.trackingActive) {
      console.log('🔄 Auto-resuming background tracking for:', driverData.name);
      await this.startBackgroundTracking(driverData, true);
    }
  }
  
  // Enhanced message handling from service worker
  static handleServiceWorkerMessage(event) {
    const { type, data, source, timestamp } = event.data;
    
    switch (type) {
      case 'LOCATION_UPDATE':
        console.log(`📍 Location update from service worker (${source}):`, {
          driver: data.driverName,
          location: `${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`,
          accuracy: `${data.accuracy}m`,
          speed: `${(data.speed * 3.6 || 0).toFixed(1)} km/h`
        });
        this.handleLocationUpdate(data);
        break;
        
      case 'PONG':
        console.log('💓 Service worker health check OK:', data);
        this.reconnectAttempts = 0;
        break;
        
      case 'ERROR':
        console.error('❌ Service worker error:', data);
        this.handleServiceWorkerError(data);
        break;
    }
  }
  
  // Start enhanced background tracking
  static async startBackgroundTracking(driverData, isResume = false) {
    if (this.isBackgroundTracking && !isResume) {
      console.log('⚠️ Background tracking already active');
      return;
    }
    
    try {
      // Validate driver data
      if (!driverData || !driverData.busId || !driverData.name) {
        throw new Error('Invalid driver data for background tracking');
      }
      
      console.log(`🚀 Starting enhanced background tracking for: ${driverData.name}`);
      
      // Store driver data for persistence
      this.storeDriverData(driverData);
      
      // Start service worker tracking if available
      if (this.serviceWorkerRegistration?.active) {
        this.serviceWorkerRegistration.active.postMessage({
          type: 'START_TRACKING',
          data: {
            ...driverData,
            trackingStartTime: Date.now()
          }
        });
      }
      
      // Start foreground tracking as backup
      this.startForegroundTracking(driverData);
      
      this.isBackgroundTracking = true;
      
      console.log('✅ Enhanced background tracking started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start background tracking:', error);
      this.initializeFallbackTracking();
    }
  }
  
  // Start foreground tracking as backup
  static startForegroundTracking(driverData) {
    // Clear any existing interval
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    
    // Track location immediately
    this.trackLocationForeground(driverData);
    
    // Set up continuous tracking
    this.trackingInterval = setInterval(() => {
      this.trackLocationForeground(driverData);
    }, 8000); // Every 8 seconds for foreground backup
  }
  
  // Foreground location tracking
  static trackLocationForeground(driverData) {
    if (!navigator.geolocation) return;
    
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
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          source: 'driver_dashboard',
          backgroundSource: 'foreground_backup'
        };
        
        console.log('📍 Foreground backup GPS captured:', {
          location: `${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}`,
          accuracy: `${position.coords.accuracy}m`
        });
        
        this.handleLocationUpdate(locationData);
      },
      (error) => {
        console.error('❌ Foreground GPS error:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  }
  
  // Handle location updates from any source
  static async handleLocationUpdate(locationData) {
    try {
      // Enhance location data
      const enhancedLocationData = await this.enhanceLocationData(locationData);
      
      // Save to LocationService
      const result = await LocationService.saveRealLocation(enhancedLocationData);
      
      if (result.success) {
        console.log('✅ Location saved successfully via background tracking');
        this.lastLocationUpdate = Date.now();
      } else {
        console.log('⚠️ Location save failed, but tracking continues');
      }
      
      // Store locally for immediate access
      localStorage.setItem(`latest_location_${locationData.busId}`, JSON.stringify(enhancedLocationData));
      localStorage.setItem(`last_known_driver_location_${locationData.busId}`, JSON.stringify(enhancedLocationData));
      
    } catch (error) {
      console.error('❌ Error handling location update:', error);
    }
  }
  
  // Enhance location data with route information
  static async enhanceLocationData(locationData) {
    try {
      // Get bus route information with time-based routing
      const currentTimeOfDay = LocationService.getCurrentTimeOfDay();
      const routeProgress = LocationService.getRouteProgress(locationData.lat, locationData.lng, locationData.busId, currentTimeOfDay);
      const currentStop = LocationService.getCurrentStop(locationData.lat, locationData.lng, locationData.busId, currentTimeOfDay);
      const nextStop = LocationService.getNextStop(locationData.lat, locationData.lng, locationData.busId, currentTimeOfDay);
      const busInfo = LocationService.busInfo[locationData.busId] || {};
      const routeInfo = LocationService.getRouteInfo(locationData.busId, currentTimeOfDay);
      
      return {
        ...locationData,
        busNumber: busInfo.busNumber,
        route: routeInfo ? routeInfo.route : busInfo.route,
        timeOfDay: currentTimeOfDay,
        direction: routeInfo ? routeInfo.direction : '🚌 Bus Route',
        routeIcon: routeInfo ? routeInfo.icon : '🚌',
        currentStop: currentStop,
        nextStop: nextStop,
        routeProgress: routeProgress.percentage,
        progressStatus: routeProgress.status,
        distanceToCurrentStop: routeProgress.distanceToCurrentStop,
        distanceToNextStop: routeProgress.distanceToNextStop,
        enhancedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error enhancing location data:', error);
      return locationData;
    }
  }
  
  // Ensure background tracking is active
  static ensureBackgroundTracking(driverData) {
    if (!this.isBackgroundTracking && driverData) {
      console.log('🔄 Ensuring background tracking is active');
      this.startBackgroundTracking(driverData, true);
    }
    
    // Restart service worker tracking if needed
    if (this.serviceWorkerRegistration?.active) {
      this.serviceWorkerRegistration.active.postMessage({
        type: 'UPDATE_DRIVER_DATA',
        data: driverData
      });
    }
  }
  
  // Verify tracking status
  static verifyTrackingStatus() {
    const timeSinceLastUpdate = this.lastLocationUpdate ? Date.now() - this.lastLocationUpdate : Infinity;
    
    if (timeSinceLastUpdate > 60000) { // More than 1 minute
      console.log('⚠️ No recent location updates, restarting tracking');
      const driverData = this.getStoredDriverData();
      if (driverData && driverData.trackingActive) {
        this.startBackgroundTracking(driverData, true);
      }
    }
  }
  
  // Handle service worker errors
  static handleServiceWorkerError(error) {
    console.error('❌ Service worker error:', error);
    
    this.reconnectAttempts++;
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`🔄 Attempting to restart service worker (attempt ${this.reconnectAttempts})`);
      setTimeout(() => {
        const driverData = this.getStoredDriverData();
        if (driverData) {
          this.ensureBackgroundTracking(driverData);
        }
      }, 5000 * this.reconnectAttempts); // Exponential backoff
    }
  }
  
  // Stop background tracking
  static stopBackgroundTracking() {
    console.log('⏹️ Stopping enhanced background tracking');
    
    this.isBackgroundTracking = false;
    
    // Stop service worker tracking
    if (this.serviceWorkerRegistration?.active) {
      this.serviceWorkerRegistration.active.postMessage({ type: 'STOP_TRACKING' });
    }
    
    // Stop foreground tracking
    this.stopForegroundTracking();
    
    // Clear health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Clear stored data
    this.clearStoredDriverData();
    
    console.log('✅ Background tracking stopped');
  }
  
  // Stop foreground tracking
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
  
  // Initialize fallback tracking for unsupported browsers
  static initializeFallbackTracking() {
    console.log('🔄 Initializing enhanced fallback tracking');
    
    // Use Page Visibility API to maintain tracking
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const driverData = this.getStoredDriverData();
        if (driverData && driverData.trackingActive) {
          console.log('📱 Page visible - resuming fallback tracking');
          this.startForegroundTracking(driverData);
        }
      }
    });
    
    // Use Web Workers if available
    if (typeof Worker !== 'undefined') {
      this.initializeWebWorkerTracking();
    }
  }
  
  // Initialize Web Worker tracking as fallback
  static initializeWebWorkerTracking() {
    try {
      // Create inline web worker for location tracking
      const workerCode = `
        let trackingInterval = null;
        let driverData = null;
        
        self.onmessage = function(e) {
          const { type, data } = e.data;
          
          if (type === 'START_TRACKING') {
            driverData = data;
            if (trackingInterval) clearInterval(trackingInterval);
            trackingInterval = setInterval(() => {
              self.postMessage({ type: 'TRACK_LOCATION', data: driverData });
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
      const worker = new Worker(workerUrl);
      
      worker.onmessage = (e) => {
        if (e.data.type === 'TRACK_LOCATION') {
          const driverData = this.getStoredDriverData();
          if (driverData) {
            this.trackLocationForeground(driverData);
          }
        }
      };
      
      this.webWorker = worker;
      console.log('✅ Web Worker fallback tracking initialized');
      
    } catch (error) {
      console.error('❌ Web Worker initialization failed:', error);
    }
  }
  
  // Store driver data for persistence
  static storeDriverData(driverData) {
    const trackingData = {
      ...driverData,
      trackingActive: true,
      trackingStartTime: Date.now(),
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('driverTrackingData', JSON.stringify(trackingData));
    localStorage.setItem('backgroundTrackingActive', 'true');
  }
  
  // Get stored driver data
  static getStoredDriverData() {
    try {
      const stored = localStorage.getItem('driverTrackingData');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting stored driver data:', error);
      return null;
    }
  }
  
  // Clear stored driver data
  static clearStoredDriverData() {
    localStorage.removeItem('driverTrackingData');
    localStorage.removeItem('backgroundTrackingActive');
  }
  
  // Get tracking status
  static getTrackingStatus() {
    return {
      isBackgroundTracking: this.isBackgroundTracking,
      hasServiceWorker: !!this.serviceWorkerRegistration?.active,
      lastLocationUpdate: this.lastLocationUpdate,
      driverData: this.getStoredDriverData(),
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      BackgroundLocationManager.initialize();
    });
  } else {
    BackgroundLocationManager.initialize();
  }
}

console.log('🔧 Enhanced Background Location Manager loaded');
console.log('📍 Features: Service Worker, Web Worker fallback, Health monitoring, Auto-resume');

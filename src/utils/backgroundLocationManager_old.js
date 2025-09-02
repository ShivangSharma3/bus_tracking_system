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
  
  // Setup health monitoring for continuous tracking
  static setupHealthMonitoring() {
    // Ping service worker every 30 seconds to ensure it's alive
    this.healthCheckInterval = setInterval(() => {
      if (this.isBackgroundTracking && this.serviceWorkerRegistration?.active) {
        this.serviceWorkerRegistration.active.postMessage({ type: 'PING' });
      }
    }, 30000);
  }
  
  // Handle page visibility changes
  static setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      const driverData = this.getStoredDriverData();
      
      if (document.hidden) {
        console.log('📱 Page hidden - ensuring background tracking continues');
        if (driverData && driverData.trackingActive) {
          this.ensureBackgroundTracking(driverData);
        }
      } else {
        console.log('📱 Page visible - checking tracking status');
        if (driverData && driverData.trackingActive) {
          this.verifyTrackingStatus();
        }
      }
    });
  }
  
  // Enhanced message handling from service worker
  static handleServiceWorkerMessage(event) {
    const { type, data, source } = event.data;
    
    switch (type) {
      case 'LOCATION_UPDATE':
        console.log(`📍 Received location update from service worker (${source}):`, data);
        this.handleLocationUpdate(data);
        break;
        
      case 'PONG':
        console.log('💓 Service worker health check OK:', data);
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful ping
        break;
        
      case 'ERROR':
        console.error('❌ Service worker error:', data);
        this.handleServiceWorkerError(data);
        break;
    }
  }
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
  
  // Foreground tracking as backup
  static startForegroundTracking(driverData) {
    if (this.trackingInterval) return; // Already tracking
    
    const trackLocation = () => {
      if (!navigator.geolocation) return;        navigator.geolocation.getCurrentPosition(
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
          
          console.log('📍 Background Manager GPS (Driver Only):', locationData);
          this.saveLocationData(locationData);
        },
        (error) => {
          console.error('❌ Foreground GPS error:', error);
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
        console.log('📱 Page hidden - ensuring service worker takes over GPS tracking');
        // Stop foreground tracking to save resources
        this.stopForegroundTracking();
        
        // Ensure service worker is tracking
        if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
          this.serviceWorkerRegistration.active.postMessage({
            type: 'START_TRACKING',
            data: driverData
          });
          console.log('🔄 Background tracking activated via service worker');
        }
      } else {
        console.log('📱 Page visible - resuming foreground tracking as backup');
        // Resume foreground tracking as backup
        this.startForegroundTracking(driverData);
        
        // Service worker continues in background as well
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
        console.log('🚪 Page unloading - transferring GPS tracking to service worker');
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
        console.log('📱 App switching - ensuring background GPS continues');
        if (this.serviceWorkerRegistration.active) {
          this.serviceWorkerRegistration.active.postMessage({
            type: 'START_TRACKING',
            data: driverData
          });
        }
      }
    });
    
    // Handle app resuming on mobile
    window.addEventListener('pageshow', () => {
      const driverData = this.getStoredDriverData();
      if (driverData && driverData.trackingActive) {
        console.log('📱 App resumed - checking tracking status');
        // Resume foreground tracking
        this.startForegroundTracking(driverData);
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
    
    const currentTimeOfDay = LocationService.getCurrentTimeOfDay();
    const routeProgress = LocationService.getRouteProgress(locationData.lat, locationData.lng, locationData.busId, currentTimeOfDay);
    const currentStop = LocationService.getCurrentStop(locationData.lat, locationData.lng, locationData.busId, currentTimeOfDay);
    const nextStop = LocationService.getNextStop(locationData.lat, locationData.lng, locationData.busId, currentTimeOfDay);
    const busInfo = LocationService.busInfo[locationData.busId] || {};
    const routeInfo = LocationService.getRouteInfo(locationData.busId, currentTimeOfDay);
    
    return {
      ...locationData,
      busNumber: busInfo.busNumber || `BUS-${locationData.busId.slice(-3)}`,
      route: routeInfo ? routeInfo.route : (busInfo.route || 'Unknown Route'),
      timeOfDay: currentTimeOfDay,
      direction: routeInfo ? routeInfo.direction : '🚌 Bus Route',
      routeIcon: routeInfo ? routeInfo.icon : '🚌',
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


// Environment-based configuration
const isDevelopment = import.meta.env.MODE === 'development';

// API Base URLs
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001'
  : (import.meta.env.VITE_BACKEND_URL || 'https://bus-tracking-system-4.onrender.com');

// WebSocket URLs
export const WS_BASE_URL = isDevelopment
  ? 'ws://localhost:3001'
  : (import.meta.env.VITE_WS_URL || 'wss://bus-tracking-system-4.onrender.com');

// App Configuration
export const APP_CONFIG = {
  name: 'Bus Tracking System',
  version: '1.0.0',
  environment: import.meta.env.MODE,
};

// Location tracking settings
export const LOCATION_CONFIG = {
  updateInterval: 15000, // 15 seconds
  accuracy: 10, // meters
  timeout: 30000, // 30 seconds
};

// Google Maps configuration
export const MAPS_CONFIG = {
  defaultCenter: { lat: 28.6139, lng: 77.2090 }, // Delhi
  defaultZoom: 12,
};

export default {
  API_BASE_URL,
  WS_BASE_URL,
  APP_CONFIG,
  LOCATION_CONFIG,
  MAPS_CONFIG,
};
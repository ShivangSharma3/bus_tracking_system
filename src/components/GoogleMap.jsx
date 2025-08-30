import { useState, useEffect, useRef } from 'react';
import FallbackMap from './FallbackMap.jsx';

export default function GoogleMap({ busLocations, selectedBus, center, zoom = 12, isAPILoaded = false, hasError = false }) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [map, setMap] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // If there's an API error, show fallback
  if (hasError) {
    return <FallbackMap busLocations={busLocations} selectedBus={selectedBus} center={center} zoom={zoom} />;
  }

  // Initialize Google Map
  useEffect(() => {
    if (!isAPILoaded || !window.google || !window.google.maps) {
      return;
    }

    const mapOptions = {
      center: center || { lat: 28.6139, lng: 77.2090 },
      zoom: zoom,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true
    };

    const googleMap = new window.google.maps.Map(mapRef.current, mapOptions);
    setMap(googleMap);
    setIsMapLoaded(true);
  }, [center, zoom, isAPILoaded]);

  // Update bus markers when locations change
  useEffect(() => {
    if (!map || !busLocations) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers for each bus
    busLocations.forEach((bus, index) => {
      if (bus.lat && bus.lng) {
        const position = { lat: bus.lat, lng: bus.lng };
        
        // Create custom icon for bus
        const busIcon = {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="15" fill="${selectedBus === bus.id ? '#3B82F6' : '#10B981'}" stroke="#FFFFFF" stroke-width="2"/>
              <text x="16" y="20" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">🚌</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        };

        const marker = new window.google.maps.Marker({
          position: position,
          map: map,
          title: bus.busNumber || `Bus ${bus.id?.slice(-3)}`,
          icon: busIcon,
          animation: window.google.maps.Animation.BOUNCE
        });

        // Create info window with bus details
        const infoContent = `
          <div style="padding: 12px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1F2937; font-size: 16px; font-weight: bold;">
              🚌 ${bus.busNumber || `Bus ${bus.id?.slice(-3)}`}
            </h3>
            <div style="font-size: 14px; color: #4B5563; line-height: 1.5;">
              <p style="margin: 4px 0;"><strong>Driver:</strong> ${bus.driver || 'Unknown'}</p>
              <p style="margin: 4px 0;"><strong>Route:</strong> ${bus.route || 'Unknown'}</p>
              <p style="margin: 4px 0;"><strong>Speed:</strong> ${bus.speed ? `${(bus.speed * 3.6).toFixed(1)} km/h` : '0 km/h'}</p>
              <p style="margin: 4px 0;"><strong>Last Update:</strong> ${bus.lastUpdate || new Date().toLocaleTimeString()}</p>
              <div style="margin-top: 8px; display: flex; align-items: center;">
                <div style="width: 8px; height: 8px; background-color: #10B981; border-radius: 50%; margin-right: 6px;"></div>
                <span style="color: #10B981; font-weight: 600; font-size: 12px;">Live Tracking</span>
              </div>
            </div>
          </div>
        `;

        const infoWindow = new window.google.maps.InfoWindow({
          content: infoContent
        });

        // Show info window on marker click
        marker.addListener('click', () => {
          // Close all other info windows
          markersRef.current.forEach(m => {
            if (m.infoWindow) {
              m.infoWindow.close();
            }
          });
          infoWindow.open(map, marker);
        });

        // Stop bouncing after 3 seconds
        setTimeout(() => {
          marker.setAnimation(null);
        }, 3000);

        // Store marker and info window reference
        marker.infoWindow = infoWindow;
        markersRef.current.push(marker);

        // Auto-open info window for selected bus
        if (selectedBus === bus.id) {
          setTimeout(() => {
            infoWindow.open(map, marker);
            map.panTo(position);
          }, 500);
        }
      }
    });

    // Fit map to show all markers if multiple buses
    if (busLocations.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      busLocations.forEach(bus => {
        if (bus.lat && bus.lng) {
          bounds.extend({ lat: bus.lat, lng: bus.lng });
        }
      });
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 15) map.setZoom(15);
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [map, busLocations, selectedBus]);

  // Update map center when center prop changes
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);

  if (!isAPILoaded || !window.google || !window.google.maps) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg border border-gray-300 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {!isAPILoaded ? 'Loading Google Maps API...' : 'Initializing Google Maps...'}
          </h3>
          <p className="text-gray-600">Please wait while we initialize the map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '300px' }}
      />
      
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';

export default function FallbackMap({ busLocations, selectedBus, center, zoom = 12 }) {
  // Simple coordinate to pixel conversion for visualization
  const coordinateToPixel = (lat, lng, bounds) => {
    const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * 100;
    const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  // Calculate bounds for all bus locations
  const getBounds = () => {
    if (!busLocations || busLocations.length === 0) {
      return { north: 28.7, south: 28.5, east: 77.3, west: 77.0 };
    }
    
    const lats = busLocations.map(bus => bus.lat).filter(Boolean);
    const lngs = busLocations.map(bus => bus.lng).filter(Boolean);
    
    if (lats.length === 0 || lngs.length === 0) {
      return { north: 28.7, south: 28.5, east: 77.3, west: 77.0 };
    }
    
    const padding = 0.01;
    return {
      north: Math.max(...lats) + padding,
      south: Math.min(...lats) - padding,
      east: Math.max(...lngs) + padding,
      west: Math.min(...lngs) - padding
    };
  };

  const bounds = getBounds();

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg border-2 border-blue-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center">
            🗺️ <span className="ml-2">Live Bus Tracking</span>
          </h3>
          <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
            Alternative View
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        {busLocations && busLocations.length > 0 ? (
          <div className="h-full flex flex-col">
            {/* Visual Map Area */}
            <div className="relative bg-green-100 rounded-xl border-2 border-green-200 mb-6 h-48 overflow-hidden">
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-30">
                <div className="grid grid-cols-10 grid-rows-10 h-full w-full">
                  {Array.from({ length: 100 }).map((_, i) => (
                    <div key={i} className="border border-green-300/50"></div>
                  ))}
                </div>
              </div>

              {/* Roads */}
              <div className="absolute inset-0">
                <div className="absolute top-1/2 w-full h-1 bg-gray-400 transform -translate-y-1/2"></div>
                <div className="absolute left-1/2 h-full w-1 bg-gray-400 transform -translate-x-1/2"></div>
              </div>

              {/* Bus Markers */}
              {busLocations.map((bus, index) => {
                if (!bus.lat || !bus.lng) return null;
                const position = coordinateToPixel(bus.lat, bus.lng, bounds);
                const isSelected = selectedBus === bus.id;
                
                return (
                  <div
                    key={bus.id || index}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                      isSelected ? 'scale-125 z-10' : 'hover:scale-110'
                    }`}
                    style={{ 
                      left: `${position.x}%`, 
                      top: `${position.y}%` 
                    }}
                  >
                    <div className={`relative ${isSelected ? 'animate-bounce' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                        isSelected ? 'bg-red-500' : 'bg-blue-500'
                      }`}>
                        🚌
                      </div>
                      {isSelected && (
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                          {bus.busNumber}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg p-2 text-xs">
                <div className="font-bold mb-1">Map Area</div>
                <div>📍 {bounds.north.toFixed(3)}°N - {bounds.south.toFixed(3)}°N</div>
                <div>📍 {bounds.west.toFixed(3)}°E - {bounds.east.toFixed(3)}°E</div>
              </div>
            </div>

            {/* Bus Information Cards */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {busLocations.map((bus, index) => (
                  <div 
                    key={bus.id || index}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedBus === bus.id 
                        ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105' 
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-gray-800 flex items-center">
                        🚌 <span className="ml-2">{bus.busNumber || `Bus ${bus.id?.slice(-3)}`}</span>
                      </h5>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                        <span className="text-xs text-green-600 font-semibold">Live</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <p><strong>Driver:</strong> {bus.driver || 'Unknown'}</p>
                      <p><strong>Route:</strong> {bus.route || 'Unknown'}</p>
                      {bus.lat && bus.lng && (
                        <p><strong>Location:</strong> {bus.lat.toFixed(4)}, {bus.lng.toFixed(4)}</p>
                      )}
                      {bus.speed !== undefined && (
                        <p><strong>Speed:</strong> {(bus.speed * 3.6).toFixed(1)} km/h</p>
                      )}
                      <p><strong>Last Update:</strong> {bus.lastUpdate || new Date().toLocaleTimeString()}</p>
                    </div>
                    
                    {bus.lat && bus.lng && (
                      <button
                        onClick={() => window.open(`https://www.google.com/maps?q=${bus.lat},${bus.lng}`, '_blank')}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <span>📍</span>
                        <span>View on Google Maps</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🚌</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Buses Available</h3>
              <p className="text-gray-500">Bus locations will appear here when drivers enable GPS tracking</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-3 border-t border-gray-200">
        <div className="text-center text-sm text-gray-500">
          <p>📡 Real-time tracking • 🔄 Auto-refresh every 5 seconds</p>
          <p className="text-xs mt-1">Note: Google Maps temporarily unavailable - using alternative view</p>
        </div>
      </div>
    </div>
  );
}

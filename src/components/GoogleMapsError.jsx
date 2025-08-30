import React, { useState } from 'react';

export default function GoogleMapsError({ error }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 max-w-md bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 z-50 google-maps-error">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="text-2xl">⚠️</div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Google Maps Unavailable
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>Using alternative map view. {error}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-red-800 font-medium">
                How to fix this?
              </summary>
              <div className="mt-2 text-xs space-y-1">
                <p>1. Set up a Google Cloud project</p>
                <p>2. Enable Maps JavaScript API</p>
                <p>3. Enable billing for the project</p>
                <p>4. Create an API key</p>
                <p>5. Replace the API key in the code</p>
                <p className="mt-2">
                  <a 
                    href="https://developers.google.com/maps/documentation/javascript/get-api-key" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-red-800 underline hover:text-red-600"
                  >
                    📖 View Setup Guide
                  </a>
                </p>
              </div>
            </details>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-2 text-red-400 hover:text-red-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';

export function useGoogleMaps(apiKey) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Wait for existing script to load
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkLoaded);
          setIsLoaded(true);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (!window.google || !window.google.maps) {
          setError('Failed to load Google Maps - timeout');
        }
      }, 10000);
      return;
    }

    // Only proceed if we have a valid API key
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      setError('Please provide a valid Google Maps API key');
      return;
    }

    loadGoogleMapsScript(apiKey);

  }, [apiKey]);

  const loadGoogleMapsScript = (apiKey) => {
    const script = document.createElement('script');
    
    // Add callback function to handle initialization
    window.initGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        console.log('Google Maps API loaded successfully');
      } else {
        setError('Google Maps API failed to initialize properly');
      }
    };

    // Add callback parameter to URL
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      setError('Failed to load Google Maps API - Please check your API key and billing setup');
    };

    document.head.appendChild(script);
  };

  return { isLoaded, error };
}

#!/bin/bash

echo "🔧 Testing Frontend-Backend Connection"
echo "======================================"

echo ""
echo "📍 Frontend URL: https://bus-tracking-system-x9n6.vercel.app"
echo "🔗 Backend URL: https://bus-tracking-system-4.onrender.com"
echo ""

echo "Testing backend health endpoint..."
curl -s "https://bus-tracking-system-4.onrender.com/api/health" || echo "Health endpoint not available"

echo ""
echo "Testing backend CORS configuration..."
curl -s -H "Origin: https://bus-tracking-system-x9n6.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     "https://bus-tracking-system-4.onrender.com/api/location/all-locations"

echo ""
echo "Testing location API..."
curl -s "https://bus-tracking-system-4.onrender.com/api/location/all-locations" | head -100

echo ""
echo "✅ Connection test completed!"
echo "If you see JSON data above, the connection is working!"
echo ""
echo "🚀 Next Steps:"
echo "1. Redeploy your frontend on Vercel (it will pick up the new VITE_BACKEND_URL)"
echo "2. Redeploy your backend on Render (it will pick up the new FRONTEND_URL)"
echo "3. Test the complete application flow"

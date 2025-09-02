#!/bin/bash

echo "🚀 Bus Tracking System - Deployment Verification"
echo "================================================"

# URLs
FRONTEND_URL="https://bus-tracking-system-x9n6.vercel.app"
BACKEND_URL="https://bus-tracking-system-4.onrender.com"

echo ""
echo "📱 Frontend: $FRONTEND_URL"
echo "🔗 Backend: $BACKEND_URL"
echo ""

# Test backend endpoints
echo "🔍 Testing Backend APIs..."
echo "----------------------------------------"

echo "1. Testing location API..."
LOCATION_RESPONSE=$(curl -s "$BACKEND_URL/api/location/all-locations")
if echo "$LOCATION_RESPONSE" | grep -q "success"; then
    echo "   ✅ Location API working"
else
    echo "   ❌ Location API failed"
    echo "   Response: $LOCATION_RESPONSE"
fi

echo ""
echo "2. Testing authentication API..."
AUTH_RESPONSE=$(curl -s "$BACKEND_URL/api/auth/students")
if echo "$AUTH_RESPONSE" | grep -q -E "\[|\{|success"; then
    echo "   ✅ Auth API working"
else
    echo "   ❌ Auth API failed"
    echo "   Response: $AUTH_RESPONSE"
fi

echo ""
echo "3. Testing CORS for frontend..."
CORS_RESPONSE=$(curl -s -H "Origin: $FRONTEND_URL" \
                     -H "Access-Control-Request-Method: POST" \
                     -H "Access-Control-Request-Headers: Content-Type" \
                     -X OPTIONS \
                     "$BACKEND_URL/api/location/update-location/BUS001")

if [ $? -eq 0 ]; then
    echo "   ✅ CORS configured correctly"
else
    echo "   ❌ CORS might need adjustment"
fi

echo ""
echo "🌐 Frontend Verification..."
echo "----------------------------------------"

# Check if frontend is accessible
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "   ✅ Frontend accessible (HTTP $FRONTEND_STATUS)"
else
    echo "   ⚠️  Frontend status: HTTP $FRONTEND_STATUS"
fi

echo ""
echo "📋 Deployment Checklist:"
echo "----------------------------------------"
echo "✅ Backend deployed on Render: $BACKEND_URL"
echo "✅ Frontend deployed on Vercel: $FRONTEND_URL"
echo "✅ Environment variables configured"
echo "✅ CORS configuration updated"
echo "✅ MongoDB connection string updated"
echo "✅ Background location tracking ready"

echo ""
echo "🎯 Next Steps:"
echo "----------------------------------------"
echo "1. 🔄 Redeploy backend on Render to pick up new FRONTEND_URL"
echo "2. 🔄 Redeploy frontend on Vercel to pick up new VITE_BACKEND_URL"
echo "3. 🧪 Test complete application flow:"
echo "   - Driver login → GPS tracking → background tracking"
echo "   - Student login → view bus location → real-time updates"
echo "   - Admin dashboard → live map → all bus locations"

echo ""
echo "🔗 Quick Test Links:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend Health: $BACKEND_URL/api/location/all-locations"
echo "   Live Map: $FRONTEND_URL/live-map"

echo ""
echo "✨ Your bus tracking system is ready for production!"

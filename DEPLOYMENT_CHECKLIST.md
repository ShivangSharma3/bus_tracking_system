# Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Preparation
- [x] Build process completes without errors (`npm run build`)
- [x] Environment variables configured correctly
- [x] MongoDB connection string updated
- [x] CORS configuration includes production URLs
- [x] Service worker properly configured for background tracking

### ✅ Environment Configuration

#### Backend Environment Variables (Render)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://vishmngpwd@cluster0.d8lb6oj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGO_URI=mongodb+srv://vishmngpwd@cluster0.d8lb6oj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
PORT=3001
FRONTEND_URL=https://college-bus-tracking-system-lime.vercel.app
```

#### Frontend Environment Variables (Vercel)
```env
VITE_BACKEND_URL=https://bus-tracking-system-1-gh4s.onrender.com
VITE_WS_URL=wss://bus-tracking-system-1-gh4s.onrender.com
VITE_ENVIRONMENT=production
```

### ✅ Deployment Steps

#### Backend Deployment (Render)
1. [ ] Create new Web Service on Render
2. [ ] Connect GitHub repository
3. [ ] Set build command: `cd backend && npm install`
4. [ ] Set start command: `cd backend && npm start`
5. [ ] Add environment variables
6. [ ] Deploy and test endpoints

#### Frontend Deployment (Vercel)
1. [ ] Create new project on Vercel
2. [ ] Import GitHub repository
3. [ ] Set framework preset to Vite
4. [ ] Add environment variables
5. [ ] Deploy and test application

### ✅ Post-Deployment Testing

#### Backend API Testing
- [ ] Test location update endpoint: `POST /api/location/update-location/{busId}`
- [ ] Test location fetch endpoint: `GET /api/location/current-location/{busId}`
- [ ] Test all locations endpoint: `GET /api/location/all-locations`
- [ ] Test authentication endpoints
- [ ] Verify MongoDB connection in logs

#### Frontend Testing
- [ ] Student login and dashboard functionality
- [ ] Driver login and GPS tracking
- [ ] Admin dashboard and live map
- [ ] Background location tracking across tabs
- [ ] Service worker registration and functionality

#### Cross-Device Testing
- [ ] Driver location sharing between devices
- [ ] Student receiving real-time location updates
- [ ] Background tracking persistence

### ✅ HTTPS and Security
- [ ] Verify HTTPS is working (both Render and Vercel provide SSL)
- [ ] Test service worker registration (requires HTTPS)
- [ ] Verify CORS configuration
- [ ] Check for console errors in production

## Troubleshooting Common Issues

### 1. CORS Errors
**Problem**: Frontend can't connect to backend
**Solution**: Update `FRONTEND_URL` in backend environment variables

### 2. Service Worker Issues
**Problem**: Background tracking not working
**Solution**: Ensure HTTPS is enabled and service worker is properly registered

### 3. Location API Errors
**Problem**: Location updates not saving
**Solution**: Check MongoDB connection and API endpoint URLs

### 4. Environment Variables
**Problem**: Configuration not loading
**Solution**: Verify environment variables are set correctly in hosting platforms

## Performance Monitoring

After deployment, monitor:
- [ ] API response times
- [ ] Location update frequency
- [ ] Service worker activation rates
- [ ] Error rates in production logs

## Backup and Recovery

- [ ] Database backup configured (MongoDB Atlas automatic backups)
- [ ] Code repository is properly versioned
- [ ] Environment variables documented securely
- [ ] Deployment configuration files committed to repository

# Deployment Guide

## Prerequisites
- MongoDB connection string: `mongodb+srv://vishmngpwd@cluster0.d8lb6oj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
- Render account for backend deployment
- Vercel account for frontend deployment

## Backend Deployment on Render

### Step 1: Create Web Service on Render
1. Go to [Render.com](https://render.com) and create a new account or login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `bus-tracking-system-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`

### Step 2: Set Environment Variables on Render
Add these environment variables in Render dashboard:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://vishmngpwd@cluster0.d8lb6oj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGO_URI=mongodb+srv://vishmngpwd@cluster0.d8lb6oj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
PORT=3001
FRONTEND_URL=https://college-bus-tracking-system-lime.vercel.app
```

### Step 3: Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note the service URL (e.g., `https://bus-tracking-system-1-gh4s.onrender.com`)

## Frontend Deployment on Vercel

### Step 1: Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com) and login
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root of your repository)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Set Environment Variables on Vercel
In Vercel dashboard → Settings → Environment Variables, add:
```
VITE_BACKEND_URL=https://your-render-backend-url.onrender.com
VITE_WS_URL=wss://your-render-backend-url.onrender.com
VITE_ENVIRONMENT=production
```

### Step 3: Update Backend CORS
After Vercel deployment, update the backend environment variable:
```
FRONTEND_URL=https://your-vercel-app-url.vercel.app
```

## Post-Deployment Configuration

### Update Render Configuration
If using the `render.yaml` file for deployment:
1. Update the `FRONTEND_URL` in `render.yaml` with your actual Vercel URL
2. Commit and push changes to trigger redeployment

### Update Vercel Configuration
1. Update the `VITE_BACKEND_URL` in Vercel environment variables with your actual Render URL
2. Redeploy the frontend

## Testing the Deployment

### Backend Testing
Test your backend endpoints:
```bash
curl https://your-render-url.onrender.com/api/location/all-locations
```

### Frontend Testing
1. Visit your Vercel URL
2. Test driver login and location tracking
3. Test student login and bus tracking
4. Verify background location tracking works across tabs/devices

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure FRONTEND_URL is correctly set in backend
2. **Location API Errors**: Check backend logs for MongoDB connection issues
3. **Background Tracking**: Ensure service worker is properly registered

### Logs
- **Render**: Check logs in Render dashboard
- **Vercel**: Check function logs in Vercel dashboard
- **Browser**: Check console for service worker and location errors

## Security Notes
- MongoDB credentials are exposed in environment variables - consider using Render's secrets management
- HTTPS is automatically handled by both Render and Vercel
- Service workers only work over HTTPS in production

## Performance Optimization
- Background location tracking continues even when browser tabs are closed
- Location data is cached for cross-device synchronization
- Real-time updates every 15 seconds for optimal battery usage

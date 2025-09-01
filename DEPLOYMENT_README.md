# Bus Tracking System - Deployment Guide

## 🚀 Quick Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## 📋 Deployment Requirements

This project is ready for deployment on Render with the following specifications:

### Build Settings
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18+

### Environment Variables (Optional)
No environment variables are required for basic deployment. All configuration is handled client-side.

## 🔧 Manual Deployment Steps

1. **Fork or Clone** this repository to your GitHub account
2. **Connect to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Static Site"
   - Connect your GitHub repository
3. **Configure Settings**:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Auto Deploy**: Yes (recommended)
4. **Deploy**: Click "Create Static Site"

## 📁 Project Structure

```
bus-tracking-system/
├── src/                    # React source code
├── public/                 # Static assets
├── dist/                   # Build output (generated)
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── render.yaml            # Render deployment config
└── README.md              # This file
```

## 🎯 Features

- **Student Dashboard**: Real-time bus tracking and attendance records
- **Driver Dashboard**: Location updates and attendance management
- **Admin Dashboard**: Complete system oversight and reporting
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time GPS**: Live bus location tracking
- **Attendance System**: Morning/evening trip tracking

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Maps**: Google Maps API
- **Routing**: React Router DOM
- **Data**: Local JSON storage (can be upgraded to database)
- **Deployment**: Render (Static Site)

## 📝 Deployment Notes

- The app uses client-side routing, handled by `_redirects` file
- All data is stored locally in browser storage
- Google Maps integration requires API key (configured in app)
- Build is optimized for production with minification

## 🚀 Live Demo

Once deployed, your app will be available at: `https://your-app-name.onrender.com`

## 📞 Support

For deployment issues or questions, refer to [Render Documentation](https://render.com/docs/static-sites) or create an issue in this repository.

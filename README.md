# Bus Tracking System

A comprehensive bus tracking system with real-time GPS tracking, background location services, and cross-device synchronization. Features separate dashboards for students, drivers, and administrators.

## 🚀 Features

### Student Features
- Real-time bus location tracking
- Route progress with current and next stops
- Attendance marking with location verification
- Cross-device location synchronization

### Driver Features
- GPS location sharing with background tracking
- Continuous tracking even when switching apps/tabs
- Route progress monitoring
- Student attendance management

### Admin Features
- Live bus tracking on interactive map
- Attendance records and analytics
- Driver and student management
- Export functionality for attendance data

### Background Location Tracking
- **Service Worker Implementation**: Continues tracking even when browser is closed
- **Cross-tab Communication**: Synchronizes location across multiple browser tabs
- **Persistent Storage**: Maintains tracking state across browser sessions
- **Fallback Mechanisms**: Multiple layers of location tracking reliability

## 🏗️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB
- **Location Services**: HTML5 Geolocation API, Service Workers
- **Deployment**: Vercel (Frontend), Render (Backend)

## 📁 Project Structure

```
bus/
├── public/
│   ├── sw-location.js        # Service worker for background GPS tracking
│   └── attendance.json       # Sample attendance data
├── src/
│   ├── pages/
│   │   ├── StudentDashboard.jsx
│   │   ├── DriverDashboard.jsx
│   │   └── AdminDashboard.jsx
│   ├── utils/
│   │   ├── locationService.js           # Core location tracking logic
│   │   ├── backgroundLocationManager.js # Background tracking manager
│   │   └── attendanceDB.js              # Attendance management
│   └── components/
│       └── GoogleMap.jsx     # Interactive map component
├── backend/
│   ├── index.js              # Express server with location APIs
│   ├── models/               # MongoDB models
│   └── routes/               # API routes
└── DEPLOYMENT_GUIDE.md       # Detailed deployment instructions
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ShivangSharma3/bus_tracking_system.git
cd bus_tracking_system
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install
```

3. Set up environment variables:
```bash
# Create backend environment file
cp backend/.env.example backend/.env
# Update with your MongoDB connection string
```

4. Start the development servers:
```bash
# Start backend (Terminal 1)
cd backend && npm start

# Start frontend (Terminal 2)
npm run dev
```

## 🚀 Deployment

### Quick Deploy
- **Frontend**: Deploy to Vercel using the included `vercel.json` configuration
- **Backend**: Deploy to Render using the included `render.yaml` configuration

### Detailed Instructions
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions including:
- Render backend deployment
- Vercel frontend deployment
- Environment variable configuration
- CORS setup and testing

## 🗄️ Database Configuration

The system uses MongoDB for data persistence:

### MongoDB Atlas Setup
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`
4. Update the `MONGODB_URI` in your environment variables

### Local MongoDB (Alternative)
```bash
# Install MongoDB locally
brew install mongodb/brew/mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Use local connection string
MONGODB_URI=mongodb://localhost:27017/bus
```

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Enter student credentials to log in:
   - Email: Use any email from the student.json file (e.g., amit@example.com)
   - Password: Use the corresponding password (e.g., password1)
3. After successful login, view student and bus information
4. Click "Logout" to return to the login screen

## Student Data Format

The student data is stored in `public/student.json` with the following structure:

```json
{
  "name": "Student Name",
  "rollNo": "Student Roll Number",
  "email": "student@example.com",
  "password": "password",
  "bus": { "$oid": "bus_id" }
}
```

## Available Students

The system includes 10 pre-configured students:
- Amit Sharma (amit@example.com / password1)
- Priya Singh (priya@example.com / password2)
- Ravi Kumar (ravi@example.com / password3)
- Neha Verma (neha@example.com / password4)
- Arjun Patel (arjun@example.com / password5)
- Simran Kaur (simran@example.com / password6)
- Rahul Yadav (rahul@example.com / password7)
- Anjali Gupta (anjali@example.com / password8)
- Manish Rawat (manish@example.com / password9)
- Pooja Mishra (pooja@example.com / password10)

## Technologies Used

- React 18
- Vite
- JavaScript (ES6+)
- HTML5
- CSS3

## Development

To run the project in development mode:

```bash
npm run dev
```

To build for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

For any questions or issues, please contact:
- GitHub: [@ShivangSharma3](https://github.com/ShivangSharma3)

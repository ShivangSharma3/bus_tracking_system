import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoleSelection from "./pages/RoleSelection.jsx";
import StudentLogin from "./pages/StudentLogin.jsx";
import DriverLogin from "./pages/DriverLogin.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import StudentsList from "./pages/StudentsList";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import DriverDashboard from "./pages/DriverDashboard.jsx";
import AttendanceRecords from "./pages/AttendanceRecords.jsx";
import LiveMap from "./pages/LiveMap.jsx";
import { BackgroundLocationManager } from './utils/backgroundLocationManager.js';

function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // BackgroundLocationManager auto-initializes on import
    console.log('🚀 App started - Enhanced Background Location Manager ready');
    
    return () => {
      // Cleanup if needed (though we want tracking to persist)
      console.log('App unmounting - background tracking continues');
    };
  }, []);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/login/student" element={<StudentLogin />} />
        <Route path="/login/driver" element={<DriverLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/students" element={<StudentsList />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/driver/dashboard" element={<DriverDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/attendance/records" element={<AttendanceRecords />} />
        <Route path="/live-map" element={<LiveMap />} />
      </Routes>
    </Router>
  )
}

export default App;

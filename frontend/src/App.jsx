import React from 'react';
import './App.css'; // 👈 Yeh line zaroor add karna
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import PostRide from './pages/PostRide';
import Home from './pages/Home'; // Naya Home page import kiya
import MyRides from './pages/MyRides';
import TrackRide from './pages/TrackRide';
import DriverDashboard from './pages/DriverDashboard';
import RideChat from './pages/RideChat'; 

// Routes ke andar:


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/post-ride" element={<PostRide />} />
                <Route path="/my-rides" element={<MyRides />} />
                <Route path="/track-ride" element={<TrackRide />} />
                <Route path="/driver-dashboard" element={<DriverDashboard />} />
                <Route path="/chat" element={<RideChat />} />
                
                
            </Routes>
        </Router>
    );
}

export default App;
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet marker icons fix
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

const TrackRide = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Safety check for ride data
    const rideDetails = location.state?.ride;
    const user = JSON.parse(localStorage.getItem('user'));

    const [routeCoords, setRouteCoords] = useState([]); 
    const [currentPosition, setCurrentPosition] = useState(null); 
    const [isLoading, setIsLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState("Initializing tracking...");
    
    // Use ref to keep track of simulation index without re-triggering effects
    const indexRef = useRef(0);

    // 1. Fetch Route Data (Only once)
    useEffect(() => {
        if (!rideDetails) {
            alert("No ride data found! Please start a ride from the dashboard.");
            navigate('/driver-dashboard');
            return;
        }

        const fetchRoute = async () => {
            try {
                setStatusMsg("Fetching route coordinates...");
                
                // Get Source & Destination Lats/Lons
                const sourceRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rideDetails.source)}`);
                const sourceData = await sourceRes.json();
                
                const destRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rideDetails.destination)}`);
                const destData = await destRes.json();

                if (sourceData.length > 0 && destData.length > 0) {
                    const startLat = parseFloat(sourceData[0].lat);
                    const startLon = parseFloat(sourceData[0].lon);
                    const endLat = parseFloat(destData[0].lat);
                    const endLon = parseFloat(destData[0].lon);

                    // Fetch driving path from OSRM
                    const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`);
                    const osrmData = await osrmRes.json();

                    if (osrmData.routes && osrmData.routes.length > 0) {
                        const path = osrmData.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                        setRouteCoords(path);
                        setCurrentPosition(path[0]);
                        
                        // Initial Status Update
                        if (rideDetails.status === 'posted') {
                            setStatusMsg("Ride is posted. Waiting for driver to start... 🕒");
                        } else {
                            setStatusMsg(`Live: Traveling to ${rideDetails.destination}`);
                        }
                    } else {
                        setStatusMsg("Route calculation failed.");
                    }
                } else {
                    setStatusMsg("Locations not found on map.");
                }
            } catch (error) {
                console.error("Routing error:", error);
                setStatusMsg("Network error. Please check your connection.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoute();
    }, [rideDetails, navigate]);

    // 2. Simulation logic - Only moves if status is 'in_progress'
    useEffect(() => {
        let interval;
        
        // Marker tabhi chalega jab status 'in_progress' ho
        const shouldMove = !isLoading && routeCoords.length > 0 && rideDetails?.status === 'in_progress';

        if (shouldMove) {
            interval = setInterval(() => {
                if (indexRef.current < routeCoords.length - 1) {
                    indexRef.current += 1;
                    setCurrentPosition(routeCoords[indexRef.current]);
                    setStatusMsg(`Moving... Heading towards ${rideDetails.destination} 🚗`);
                } else {
                    clearInterval(interval);
                    setStatusMsg("🏁 Destination Reached!");
                }
            }, 1000); 
        }

        return () => clearInterval(interval);
    }, [isLoading, routeCoords, rideDetails?.status]);

    if (!rideDetails) return null;

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'Poppins, sans-serif' }}>
                <div className="loader"></div>
                <h2>Mapping your journey... 🌍</h2>
                <p style={{ color: '#7f8c8d' }}>Connecting to satellites</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '20px', maxWidth: '1000px' }}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
                <div>
                    <h2 style={{ color: '#2c3e50', margin: 0 }}>Live Ride Tracking 🛰️</h2>
                    <p style={{ color: '#7f8c8d', margin: '5px 0' }}>Ride ID: #{rideDetails.ride_id}</p>
                </div>
                <button className="btn-secondary" onClick={() => navigate('/driver-dashboard')} style={{ width: 'auto' }}>
                    Back to Dashboard
                </button>
            </div>

            {/* Status Info Bar */}
            <div style={{ 
                backgroundColor: '#fff', 
                padding: '15px 25px', 
                borderRadius: '12px', 
                marginBottom: '20px', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                borderLeft: '5px solid #3498db',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <span style={{ fontSize: '12px', color: '#95a5a6', display: 'block', fontWeight: 'bold' }}>CURRENT STATUS</span>
                    <strong style={{ color: '#2c3e50' }}>{statusMsg}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', color: '#95a5a6', display: 'block', fontWeight: 'bold' }}>DRIVER</span>
                    <strong style={{ color: '#27ae60' }}>{user?.name || "Driver"} 🚗</strong>
                </div>
            </div>

            {/* Map Container */}
            <div style={{ 
                height: '500px', 
                width: '100%', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '1px solid #eee' 
            }}>
                {currentPosition && (
                    <MapContainer 
                        center={currentPosition} 
                        zoom={14} 
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; OpenStreetMap'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        {routeCoords.length > 0 && (
                            <Polyline positions={routeCoords} color="#3498db" weight={6} opacity={0.6} lineCap="round" />
                        )}

                        <Marker position={currentPosition}>
                            <Popup>
                                <div style={{ textAlign: 'center' }}>
                                    <strong>{user?.name || "Driver"}</strong> <br />
                                    {rideDetails.status === 'in_progress' ? "Moving to destination..." : "Waiting to start"}
                                </div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                )}
            </div>
            
            <p style={{ textAlign: 'center', marginTop: '15px', color: '#bdc3c7', fontSize: '12px' }}>
                Map data provided by OpenStreetMap & OSRM Engine
            </p>
        </div>
    );
};

export default TrackRide;
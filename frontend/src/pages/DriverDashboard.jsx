import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import '../Rideshare.css';

const DriverDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [myRides, setMyRides] = useState([]);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const fetchData = async (driverId) => {
        try {
            const reqResponse = await API.get(`/driver/requests/${driverId}`);
            setRequests(reqResponse.data);

            const ridesResponse = await API.get(`/driver/rides/${driverId}`);
            setMyRides(ridesResponse.data);
        } catch (error) {
            console.error("Error fetching dashboard data", error);
        }
    };

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (!loggedInUser || loggedInUser.role !== 'driver') {
            navigate('/');
            return;
        }
        setUser(loggedInUser);
        fetchData(loggedInUser.user_id);
    }, [navigate]);

    const hasAcceptedPassenger = (rideId) => {
        return requests.some(req => req.ride_id === rideId && req.booking_status === 'accepted');
    };

    const handleRespond = async (bookingId, action) => {
        try {
            await API.put(`/bookings/${bookingId}/respond`, { action });
            alert(`Request ${action} successfully!`);
            fetchData(user.user_id);
        } catch (error) {
            alert(error.response?.data?.error || 'Action failed');
        }
    };

    const handleStartRide = async (ride) => {
        if (!hasAcceptedPassenger(ride.ride_id)) {
            alert("Bhai, kam se kam ek passenger toh accept karo pehle! 🛑");
            return;
        }

        try {
            await API.put(`/rides/${ride.ride_id}/start`);
            alert('Ride Started! 🚗💨');
            // FIX: Map par auto-navigate nahi karega, sirf data refresh hoga
            fetchData(user.user_id); 
        } catch (error) {
            alert('Failed to start ride');
        }
    };

    const handleCompleteRide = async (rideId) => {
        try {
            await API.put(`/rides/${rideId}/complete`);
            alert('Ride Completed! 🏁');
            fetchData(user.user_id);
        } catch (error) {
            alert('Failed to complete ride');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '900px' }}>
            <header className="flex-between" style={{ marginBottom: '30px', padding: '10px 0' }}>
                <h2 style={{ color: '#2c3e50', margin: 0 }}>Driver Dashboard 🎛️</h2>
                <button className="btn-secondary" onClick={() => navigate('/')} style={{ width: 'auto' }}>
                    Back to Home
                </button>
            </header>

            {/* SECTION 1: Passenger Requests */}
            <section style={{ marginBottom: '40px' }}>
                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', color: '#34495e' }}>
                    Passenger Requests 🧑‍🤝‍🧑
                </h3>
                {requests.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '30px' }}>
                        <p style={{ color: '#95a5a6' }}>No passenger requests yet.</p>
                    </div>
                ) : (
                    requests.map(req => (
                        <div key={req.booking_id} className="glass-card" style={{ 
                            marginBottom: '15px', 
                            borderLeft: req.booking_status === 'accepted' ? '6px solid #2ecc71' : '6px solid #f39c12' 
                        }}>
                            <div className="flex-between">
                                <div>
                                    <p style={{ margin: '0 0 5px 0' }}><strong>Passenger:</strong> {req.passenger_name}</p>
                                    <p style={{ margin: '0', fontSize: '14px', color: '#7f8c8d' }}>
                                        {req.source} ➔ {req.destination}
                                    </p>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
                                        Status: <span style={{ color: req.booking_status === 'accepted' ? '#27ae60' : '#e67e22', fontWeight: 'bold' }}>
                                            {req.booking_status.toUpperCase()}
                                        </span>
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {req.booking_status === 'pending' && (
                                        <>
                                            <button onClick={() => handleRespond(req.booking_id, 'accepted')} className="btn-success" style={{ width: 'auto', padding: '8px 15px' }}>Accept ✅</button>
                                            <button onClick={() => handleRespond(req.booking_id, 'rejected')} className="btn-danger" style={{ width: 'auto', padding: '8px 15px' }}>Reject ❌</button>
                                        </>
                                    )}
                                    <button 
                                        className="btn-purple"
                                        style={{ width: 'auto', padding: '8px 15px' }}
                                        onClick={() => navigate('/chat', { state: { bookingId: req.booking_id, otherPersonName: req.passenger_name } })}
                                    >
                                        Chat 💬
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </section>

            {/* SECTION 2: My Posted Rides */}
            <section>
                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', color: '#34495e' }}>
                    My Posted Rides 🚗
                </h3>
                {myRides.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '30px' }}>
                        <p style={{ color: '#95a5a6' }}>You haven't posted any rides yet.</p>
                        <button className="btn-primary" onClick={() => navigate('/post-ride')} style={{ width: 'auto', marginTop: '10px' }}>Post a Ride</button>
                    </div>
                ) : (
                    myRides.map(ride => {
                        const isReady = hasAcceptedPassenger(ride.ride_id);
                        return (
                            <div key={ride.ride_id} className="glass-card" style={{ marginBottom: '15px', backgroundColor: '#fff' }}>
                                <div className="flex-between" style={{ alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{ride.source} ➔ {ride.destination}</h4>
                                        <p style={{ margin: '0', fontSize: '13px', color: '#7f8c8d' }}>
                                            Status: <span style={{ 
                                                color: ride.status === 'in_progress' ? '#9b59b6' : (ride.status === 'completed' ? '#27ae60' : '#3498db'), 
                                                fontWeight: '700' 
                                            }}>
                                                {ride.status.toUpperCase()}
                                            </span>
                                        </p>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        {/* Status: Posted - Clean logic for waiting text */}
                                        {ride.status === 'posted' && (
                                            <>
                                                {!isReady && (
                                                    <span style={{ fontSize: '12px', color: '#95a5a6', fontStyle: 'italic' }}>
                                                        Waiting for passengers... ⏳
                                                    </span>
                                                )}
                                                <button 
                                                    onClick={() => handleStartRide(ride)} 
                                                    disabled={!isReady}
                                                    className={isReady ? "btn-success" : ""}
                                                    style={{ 
                                                        width: 'auto', 
                                                        padding: '8px 18px',
                                                        borderRadius: '8px',
                                                        fontWeight: '600',
                                                        backgroundColor: isReady ? '#27ae60' : '#dcdde1',
                                                        color: isReady ? '#fff' : '#bdc3c7',
                                                        border: 'none',
                                                        cursor: isReady ? 'pointer' : 'not-allowed'
                                                    }}
                                                >
                                                    Start Ride 🚀
                                                </button>
                                            </>
                                        )}

                                        {/* Status: In Progress - Yahan Track button milega */}
                                        {ride.status === 'in_progress' && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => navigate('/track-ride', { state: { ride: ride } })} className="btn-purple" style={{ width: 'auto', padding: '8px 15px' }}>Track 🛰️</button>
                                                <button onClick={() => handleCompleteRide(ride.ride_id)} className="btn-success" style={{ width: 'auto', padding: '8px 15px' }}>Complete ✅</button>
                                            </div>
                                        )}

                                        {/* Status: Completed */}
                                        {ride.status === 'completed' && (
                                            <span style={{ color: '#27ae60', fontWeight: '700', fontSize: '13px' }}>FINISHED ✨</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </section>
        </div>
    );
};

export default DriverDashboard;
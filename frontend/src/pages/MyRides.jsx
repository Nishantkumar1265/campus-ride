import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import '../Rideshare.css'; // Global CSS

const MyRides = () => {
    const [myRides, setMyRides] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // API se passenger ki bookings fetch karne ka function
    const fetchMyRides = async (userId) => {
        try {
            const response = await API.get(`/my-bookings/${userId}`);
            setMyRides(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching my rides", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (!loggedInUser) {
            navigate('/login');
            return;
        }
        setUser(loggedInUser);

        if (loggedInUser.role === 'passenger') {
            fetchMyRides(loggedInUser.user_id);
        }
    }, [navigate]);

    // Driver ko rate karne ka function
    const handleRateDriver = async (bookingId, ratingValue) => {
        try {
            await API.put(`/bookings/${bookingId}/rate`, { rating: ratingValue });
            alert(`Thank you for giving ${ratingValue} stars! ⭐`);
            // UI refresh karne ke liye data wapas fetch karo
            fetchMyRides(user.user_id);
        } catch (error) {
            console.error("Error rating driver", error);
            alert('Failed to submit rating');
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
                <h3>Loading your bookings... ⏳</h3>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Header Section */}
            <header className="main-header flex-between">
                <h1 style={{ margin: 0 }}>My Bookings 🎫</h1>
                <button className="btn-primary" onClick={() => navigate('/')} style={{ width: 'auto' }}>
                    Back to Home
                </button>
            </header>

            {myRides.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '50px', marginTop: '20px' }}>
                    <p style={{ fontSize: '18px', color: '#7f8c8d' }}>
                        You haven't booked any rides yet. 🚶‍♂️
                    </p>
                </div>
            ) : (
                /* 🔥 YAHAN FIX KIYA HAI: Grid hata kar Flexbox lagaya hai 🔥 */
                <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '25px', 
                    padding: '20px 0',
                    width: '100%'
                }}>
                    {myRides.map((ride) => (
                        <div key={ride.booking_id} className="glass-card" 
                             style={{ 
                                flex: '1 1 calc(33.33% - 25px)', /* Cards ko line mein laane ke liye */
                                minWidth: '300px', /* Card ki minimum chaurai */
                                maxWidth: '400px', /* Card bahut lamba na faile */
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'space-between', 
                                padding: '20px',
                                minHeight: '320px', 
                                boxSizing: 'border-box'
                             }}>
                             
                            {/* Route Info */}
                            <div className="ride-info">
                                <h3 style={{ color: '#3498db', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px 0' }}>
                                    <span>📍</span> {ride.source}
                                </h3>
                                <h3 style={{ color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 15px 0' }}>
                                    <span>🏁</span> {ride.destination}
                                </h3>
                                
                                <div style={{ fontSize: '14px', color: '#555' }}>
                                    <p style={{ margin: '5px 0' }}><strong>Driver:</strong> {ride.driver_name} 
                                        <span style={{ color: '#f1c40f', marginLeft: '5px' }}>⭐ {ride.driver_rating || '4.0'}</span>
                                    </p>
                                    <p style={{ margin: '5px 0' }}><strong>Departure:</strong> {new Date(ride.booked_on || Date.now()).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Status & Price Section */}
                            <div style={{ 
                                background: 'rgba(0,0,0,0.03)', 
                                padding: '12px', 
                                borderRadius: '12px', 
                                margin: '15px 0' 
                            }}>
                                <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '600' }}>Share Amount:</span>
                                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60' }}>₹{ride.cost_per_seat}</span>
                                </div>
                                <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                                    <span style={{ fontSize: '13px' }}>Status:</span>
                                    <span className={`ride-status-badge ${ride.booking_status === 'accepted' || ride.booking_status === 'completed' ? 'status-accepted' : 'status-pending'}`}>
                                        {ride.booking_status}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons Area */}
                            <div className="card-footer" style={{ borderTop: 'none', padding: 0, marginTop: 'auto' }}>
                                {(ride.booking_status === 'accepted' || ride.booking_status === 'booked') && (
                                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                        <button className="btn-primary" style={{ flex: 1, padding: '10px' }}
                                                onClick={() => navigate('/track-ride', { state: { ride: ride } })}>
                                            Track 📍
                                        </button>
                                        <button className="btn-purple" style={{ flex: 1, padding: '10px' }}
                                                onClick={() => navigate('/chat', { state: { bookingId: ride.booking_id, otherPersonName: ride.driver_name } })}>
                                            Chat 💬
                                        </button>
                                    </div>
                                )}

                                {ride.booking_status === 'completed' && (
                                    <div style={{ width: '100%' }}>
                                        <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#666' }}>Rate Your Experience:</p>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <span 
                                                    key={star} 
                                                    onClick={() => handleRateDriver(ride.booking_id, star)}
                                                    style={{ cursor: 'pointer', fontSize: '26px', color: '#f1c40f', transition: 'transform 0.2s' }}
                                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                                >★</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyRides;
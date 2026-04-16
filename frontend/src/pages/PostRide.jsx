import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const PostRide = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        source: '',
        destination: '',
        departure_time: '',
        seats_available: 1,
        cost_per_seat: 0
    });

    // --- FUNCTION: Current Date/Time in HTML Format (YYYY-MM-DDTHH:mm) ---
    const getCurrentDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Authentication Check
    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (!loggedInUser) {
            alert("Please login first!");
            navigate('/login');
        } else if (loggedInUser.role !== 'driver') {
            alert("Only drivers can post a ride!");
            navigate('/');
        } else {
            setUser(loggedInUser);
        }
    }, [navigate]);

    // --- UPDATED LOGIC: Handle Input with Time Validation ---
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'departure_time') {
            const selectedTime = new Date(value);
            const currentTime = new Date();

            // Agar user ne aaj ki date mein purana time select kiya
            if (selectedTime < currentTime) {
                alert("You cannot select a past time! Please choose a future time.");
                // Reset to current time
                setFormData({ ...formData, [name]: getCurrentDateTime() });
                return;
            }
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Final Double Check before API Call
        const selectedTime = new Date(formData.departure_time);
        if (selectedTime < new Date()) {
            alert("Departure time must be in the future.");
            return;
        }

        try {
            const rideData = { ...formData, driver_id: user.user_id };
            await API.post('/rides', rideData);
            alert('Ride Posted Successfully! 🚗');
            navigate('/'); 
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to post ride');
        }
    };

    if (!user) return <p>Loading...</p>;

    return (
        <div className="form-container" style={{ maxWidth: '500px', margin: '50px auto', padding: '30px', background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#2c3e50' }}>Post a Ride 🗺️</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>From (Source):</label>
                    <input 
                        type="text" 
                        name="source" 
                        placeholder="e.g. Hostel A" 
                        onChange={handleChange} 
                        required 
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', outlineColor: '#764ba2' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>To (Destination):</label>
                    <input 
                        type="text" 
                        name="destination" 
                        placeholder="e.g. Railway Station" 
                        onChange={handleChange} 
                        required 
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', outlineColor: '#764ba2' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Departure Time:</label>
                    <input 
                        type="datetime-local" 
                        name="departure_time" 
                        value={formData.departure_time}
                        onChange={handleChange} 
                        min={getCurrentDateTime()} // Calendar mein dates disable karega
                        required 
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', outlineColor: '#764ba2' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Seats Available:</label>
                    <input 
                        type="number" 
                        name="seats_available" 
                        min="1" 
                        max="6" 
                        onChange={handleChange} 
                        required 
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                    />
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Cost per Seat (₹):</label>
                    <input 
                        type="number" 
                        name="cost_per_seat" 
                        min="0" 
                        onChange={handleChange} 
                        required 
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                    />
                </div>
                
                <button 
                    type="submit" 
                    className="btn-success" 
                    style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #28a745, #218838)', color: 'white' }}
                >
                    Post Ride
                </button>
            </form>
        </div>
    );
};

export default PostRide;
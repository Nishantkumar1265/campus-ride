import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import '../Rideshare.css';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Tumhara purana route '/login' tha, maine wahi kar diya hai
            const response = await API.post('/login', formData); 
            alert('Login Successful! 🚀');
            localStorage.setItem('user', JSON.stringify(response.data.user));
            navigate('/'); 
        } catch (error) {
            console.error("Login Error:", error.response);
            alert(error.response?.data?.error || 'Login failed ❌ Check credentials.');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="glass-card auth-card">
                <h2 className="auth-title" style={{ textAlign: 'center' }}>Campus Ride 🚗💨</h2>
                <form className="form-group" onSubmit={handleSubmit}>
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Email Address</label>
                        <input 
                            className="input-field" 
                            type="email" 
                            name="email" 
                            placeholder="Enter email"
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Password</label>
                        <input 
                            className="input-field" 
                            type="password" 
                            name="password" 
                            placeholder="Enter password"
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <button className="btn-primary" type="submit" style={{ marginTop: '10px', padding: '12px' }}>
                        Login
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                    Don't have an account? <Link to="/register" className="auth-link">Register here</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
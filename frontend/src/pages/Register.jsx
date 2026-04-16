import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import '../Rideshare.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'passenger'
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Route wapas '/register' kar diya hai
            await API.post('/register', formData); 
            alert('Registration Successful! Please login. 🎉');
            navigate('/login');
        } catch (error) {
            console.error("Register Error:", error.response);
            alert(error.response?.data?.error || 'Registration failed ❌');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="glass-card auth-card">
                <h2 className="auth-title" style={{ textAlign: 'center' }}>Create Account 🎓</h2>
                <form className="form-group" onSubmit={handleSubmit}>
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Full Name</label>
                        <input 
                            className="input-field"
                            type="text" 
                            name="name" // CRITICAL: This must match state
                            placeholder="Your Name"
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Email</label>
                        <input 
                            className="input-field"
                            type="email" 
                            name="email" 
                            placeholder="College Email"
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
                            placeholder="Min 6 characters"
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Role</label>
                        <select className="input-field" name="role" onChange={handleChange}>
                            <option value="passenger">Passenger</option>
                            <option value="driver">Driver</option>
                        </select>
                    </div>
                    <button className="btn-success" type="submit" style={{ marginTop: '10px', padding: '12px' }}>
                        Register Now 🚀
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                    Already have an account? <Link to="/login" className="auth-link">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
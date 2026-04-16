import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import '../Rideshare.css';
import myPhoto from '../assets/myphoto.png';

const Home = () => {
    const [rides, setRides] = useState([]);
    const [filteredRides, setFilteredRides] = useState([]);
    const [user, setUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState({ from: '', to: '' });
    
    // Stats States
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [activeRides, setActiveRides] = useState([]); 

    // Footer Modal/Pop-up State (MODIFIED HERE)
    const [activeModal, setActiveModal] = useState(null);

    const navigate = useNavigate();

    // --- LOGIC: Date & Time Formatting ---
    const formatRideDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'long' 
        });
    };

    const formatRideTime = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
        });
    };

    // --- LOGIC: Fetch Data ---
    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (loggedInUser) setUser(loggedInUser);

        const fetchData = async () => {
            try {
                const response = await API.get(`/rides`); 
                const availableRides = response.data;
                setRides(availableRides);
                setFilteredRides(availableRides);

                if (loggedInUser && loggedInUser.role === 'driver') {
                    const driverRidesRes = await API.get(`/driver/rides/${loggedInUser.user_id}`);
                    const myRides = driverRidesRes.data;

                    const finishedRides = myRides.filter(ride => 
                        ride.status?.toLowerCase() === 'completed'
                    );
                    const earnings = finishedRides.reduce((acc, ride) => acc + (Number(ride.cost_per_seat) || 0), 0);
                    setTotalEarnings(earnings);

                    const currentActiveList = myRides.filter(ride => 
                        ['posted', 'ongoing', 'in_progress'].includes(ride.status?.toLowerCase())
                    );
                    setActiveRides(currentActiveList);
                }
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            }
        };
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchQuery(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault(); 
        const fromQ = searchQuery.from.toLowerCase().trim();
        const toQ = searchQuery.to.toLowerCase().trim();
        const result = rides.filter(ride => {
            const sMatch = fromQ === "" || ride.source.toLowerCase().includes(fromQ);
            const dMatch = toQ === "" || ride.destination.toLowerCase().includes(toQ);
            return sMatch && dMatch;
        });
        setFilteredRides(result);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/');
    };

    const handleRequestJoin = async (rideId) => {
        if (!user) {
            alert("Please login first!");
            navigate('/login');
            return;
        }
        if (user.role !== 'passenger') {
            alert("Only passengers can request to join rides!");
            return;
        }
        try {
            await API.post('/bookings', { ride_id: rideId, passenger_id: user.user_id });
            alert("Ride request sent! ⏳");
        } catch (error) {
            alert(error.response?.data?.error || "Failed to send request.");
        }
    };

    const statCardStyle = {
        padding: '25px',
        borderRadius: '20px',
        background: 'white',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.03)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '220px',
    };

    // --- REUSABLE COMPACT MODAL (ADDED HERE) ---
    const Modal = ({ title, onClose, children }) => (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: 'white', padding: '30px', borderRadius: '25px',
                width: '90%', maxWidth: '380px', textAlign: 'center',
                boxShadow: '0 15px 40px rgba(0,0,0,0.2)'
            }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>{title}</h3>
                <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '25px' }}>
                    {children}
                </div>
                <button 
                    className="btn-primary" 
                    onClick={onClose}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 'bold' }}
                >
                    Close
                </button>
            </div>
        </div>
    );

    // --- NEW SECTIONS COMPONENTS ---
    const LandingExtraContent = () => (
        <div style={{ marginTop: '80px' }}>
            {/* How It Works */}
            <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '40px' }}>How it works? 🛠️</h2>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '80px', flexWrap: 'wrap' }}>
                {[
                    { step: "1", title: "Search", desc: "Find rides from Hostel to Station or anywhere." },
                    { step: "2", title: "Book", desc: "Select a ride and wait for driver approval." },
                    { step: "3", title: "Ride", desc: "Meet your campus mate and travel together." }
                ].map((item, i) => (
                    <div key={i} style={{ width: '250px', textAlign: 'center', padding: '20px', background: '#fff', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                        <div style={{ width: '40px', height: '40px', background: '#764ba2', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontWeight: 'bold' }}>{item.step}</div>
                        <h4 style={{ margin: '0 0 10px 0' }}>{item.title}</h4>
                        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* Why Us Section */}
            <div style={{ background: 'white', borderRadius: '30px', padding: '50px 30px', textAlign: 'center', marginBottom: '80px' }}>
                <h2 style={{ color: '#2c3e50', marginBottom: '30px' }}>Why Campus Ride? ✨</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
                    <div>
                        <div style={{ fontSize: '30px', marginBottom: '10px' }}>🛡️</div>
                        <h4 style={{ margin: '0 0 10px 0' }}>Verified Students</h4>
                        <p style={{ fontSize: '13px', color: '#7f8c8d' }}>Only students from NIT Goa can register.</p>
                    </div>
                    <div>
                        <div style={{ fontSize: '30px', marginBottom: '10px' }}>💰</div>
                        <h4 style={{ margin: '0 0 10px 0' }}>Cost Effective</h4>
                        <p style={{ fontSize: '13px', color: '#7f8c8d' }}>Split the fuel cost and save your pocket.</p>
                    </div>
                    <div>
                        <div style={{ fontSize: '30px', marginBottom: '10px' }}>🌱</div>
                        <h4 style={{ margin: '0 0 10px 0' }}>Eco Friendly</h4>
                        <p style={{ fontSize: '13px', color: '#7f8c8d' }}>Reduce carbon footprint by sharing seats.</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer style={{ textAlign: 'center', padding: '40px 0', color: '#95a5a6', fontSize: '14px', borderTop: '1px solid #eee' }}>
                <p>Made with ❤️ by <strong>Nishant Kumar</strong> (NIT Goa)</p>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '10px' }}>
                    <span 
                        style={{ cursor: 'pointer', color: '#764ba2', fontWeight: 'bold' }} 
                        onClick={() => setActiveModal('support')}
                    >
                        Support
                    </span>
                    <span 
                        style={{ cursor: 'pointer', color: '#764ba2', fontWeight: 'bold' }} 
                        onClick={() => setActiveModal('terms')}
                    >
                        Terms
                    </span>
                    <span 
                        style={{ cursor: 'pointer', color: '#764ba2', fontWeight: 'bold' }} 
                        onClick={() => setActiveModal('about')}
                    >
                        About Us
                    </span>
                </div>
            </footer>
        </div>
    );

    return (
        <div style={{ background: '#f8fafd', minHeight: '100vh' }}>
            
            {/* --- RENDER MODALS HERE --- */}
            {activeModal === 'support' && (
                <Modal title="Support 📞" onClose={() => setActiveModal(null)}>
                    <p>Facing issues with a ride? Reach out to me:</p>
                    <p><strong>📧 Email:</strong> kumarnishant1265@gmail.com</p>
                    <p><strong>📞 Phone:</strong> +91 7061537909</p>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>Available 10 AM - 8 PM</p>
                </Modal>
            )}

            {activeModal === 'terms' && (
                <Modal title="Terms & Conditions 📜" onClose={() => setActiveModal(null)}>
                    <div style={{ textAlign: 'left', fontSize: '13px', maxHeight: '200px', overflowY: 'auto' }}>
                        <p>1. Only valid NIT Goa students can use this platform.</p>
                        <p>2. Drivers must have a valid license.</p>
                        <p>3. Payments settled directly between users.</p>
                        <p>4. Maintain respect and safety on every journey.</p>
                    </div>
                </Modal>
            )}

            {activeModal === 'about' && (
                <Modal title="About Developer 👨‍💻" onClose={() => setActiveModal(null)}>
                    <div style={{ textAlign: 'center' }}>
                        {/* Yaha placeholder div ki jagah <img> tag use kiya hai */}
                        <img 
                            src={myPhoto}
                            alt="Nishant Kumar" 
                            style={{ 
                                width: '100px', 
                                height: '100px', 
                                borderRadius: '50%', 
                                objectFit: 'cover', // Isse photo stretch nahi hogi
                                marginBottom: '15px',
                                border: '3px solid #764ba2' // Optional: ek badhiya border
                            }} 
                        />
                        <h4 style={{ margin: '0 0 5px 0' }}>Nishant Kumar</h4>
                        <p style={{ fontSize: '12px', color: '#666' }}>
                            Student at NIT Goa. Passionate about building campus solutions.
                        </p>
                    </div>
                </Modal>
            )}

            <header style={{ 
                background: 'white', padding: '15px 5%', display: 'flex', 
                justifyContent: 'space-between', alignItems: 'center', 
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 1000
            }}>
                <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <h1 style={{ margin: 0, fontSize: '24px', color: '#2c3e50', fontWeight: '800' }}>Campus Ride 🚗</h1>
                    <p style={{ margin: 0, opacity: 0.5, fontSize: '11px' }}>TRAVEL TOGETHER, SAVE MONEY!</p>
                </div>

                <div className="nav-actions" style={{ display: 'flex', gap: '12px' }}>
                    {!user ? (
                        <>
                            <button className="btn-primary" style={{ minWidth: '110px', height: '42px' }} onClick={() => navigate('/login')}>Login</button>
                            <button className="btn-success" style={{ minWidth: '110px', height: '42px' }} onClick={() => navigate('/register')}>Register</button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <span>Hi, <strong>{user.name.split(' ')[0]}</strong> 👋</span>
                            <button className="btn-danger" onClick={handleLogout} style={{ padding: '8px 18px', borderRadius: '10px' }}>Logout</button>
                        </div>
                    )}
                </div>
            </header>

            <div className="container" style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px' }}>
                {user?.role === 'driver' ? (
                    <div style={{ padding: '20px 0' }}>
                        <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', borderRadius: '25px', marginBottom: '40px' }}>
                            <h2 style={{ fontSize: '32px', color: '#2c3e50' }}>Welcome back, Captain! 👨‍✈️</h2>
                            <p style={{ color: '#7f8c8d', margin: '20px 0 40px' }}>Manage your campus trips or post a new journey.</p>
                            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                                <button className="btn-success" onClick={() => navigate('/post-ride')} style={{ padding: '15px 40px', borderRadius: '12px' }}>+ Post New Ride</button>
                                <button className="btn-purple" onClick={() => navigate('/driver-dashboard')} style={{ padding: '15px 40px', borderRadius: '12px' }}>Go to Dashboard</button>
                            </div>
                        </div>

                        <div className="stats-row" style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
                            <div className="glass-card" style={{ ...statCardStyle, flex: 1.4, justifyContent: 'flex-start' }}>
                                <p style={{ margin: '0 0 12px 0', fontSize: '11px', fontWeight: 'bold', color: '#764ba2', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Active Routes ({activeRides.length})
                                </p>
                                <div style={{ overflowY: 'auto', maxHeight: '140px' }}>
                                    {activeRides.length > 0 ? activeRides.map(r => (
                                        <div key={r.ride_id} style={{ borderBottom: '1px solid #f0f0f0', padding: '8px 0' }}>
                                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#333' }}>{r.source} ➔ {r.destination}</div>
                                            <div style={{ fontSize: '11px', color: '#666', marginTop: '3px' }}>
                                                📅 {formatRideDate(r.departure_time)} | ⏰ {formatRideTime(r.departure_time)}
                                            </div>
                                        </div>
                                    )) : <p style={{ color: '#999', fontSize: '14px', marginTop: '10px' }}>No active rides posted.</p>}
                                </div>
                            </div>

                            <div className="glass-card" style={{ ...statCardStyle, textAlign: 'center' }}>
                                <h3 style={{ margin: '0 0 5px 0', color: '#27ae60', fontSize: '22px' }}>Verified</h3>
                                <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>Driver Profile</p>
                            </div>

                            <div className="glass-card" style={{ ...statCardStyle, textAlign: 'center' }}>
                                <h3 style={{ margin: '0 0 5px 0', color: '#e67e22', fontSize: '28px', fontWeight: '800' }}>₹{totalEarnings.toFixed(2)}</h3>
                                <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>Total Earnings</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="hero-card" style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                            borderRadius: '25px', padding: '60px 30px', color: 'white', textAlign: 'center', marginBottom: '50px'
                        }}>
                            <h2 style={{ fontSize: '38px', marginBottom: '10px', fontWeight: '800' }}>Your Campus, Your Ride! 🎓</h2>
                            <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '40px' }}>Safe and affordable carpooling for NIT Goa students.</p>
                            
                            <form onSubmit={handleSearchSubmit} style={{ 
                                background: 'white', padding: '10px', borderRadius: '18px', display: 'flex', gap: '12px', 
                                maxWidth: '850px', margin: '0 auto', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                            }}>
                                <input name="from" placeholder="From: e.g. NIT Goa" value={searchQuery.from} onChange={handleInputChange} style={{ flex: 1, border: 'none', padding: '15px', outline: 'none', color: '#333' }} />
                                <div style={{ color: '#ccc', fontWeight: 'bold' }}>➔</div>
                                <input name="to" placeholder="To: e.g. Panjim" value={searchQuery.to} onChange={handleInputChange} style={{ flex: 1, border: 'none', padding: '15px', outline: 'none', color: '#333' }} />
                                <button type="submit" className="btn-primary" style={{ height: '52px', padding: '0 35px', borderRadius: '12px', fontWeight: '700' }}>Search</button>
                            </form>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '24px', color: '#2c3e50', margin: 0 }}>Available Rides 🌍</h2>
                            {user?.role === 'passenger' && (
                                <button className="btn-purple" onClick={() => navigate('/my-rides')} style={{ borderRadius: '10px' }}>My Bookings 📅</button>
                            )}
                        </div>

                        <div className="rides-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                            {filteredRides.length === 0 ? (
                                <div className="glass-card" style={{ textAlign: 'center', gridColumn: '1/-1', padding: '80px 20px', borderRadius: '20px' }}>
                                    <p style={{ fontSize: '18px', color: '#95a5a6' }}>No rides found for this route. 🔍</p>
                                    <button onClick={() => {setFilteredRides(rides); setSearchQuery({from:'', to:''})}} style={{ color: '#764ba2', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Show all rides</button>
                                </div>
                            ) : (
                                filteredRides.map(ride => (
                                    <div key={ride.ride_id} className="glass-card ride-card" style={{ padding: '25px', borderRadius: '22px', background: 'white', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
                                            <span style={{ background: '#e8f4fd', color: '#3498db', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                                📅 {formatRideDate(ride.departure_time)}
                                            </span>
                                            <span style={{ background: '#fef5e7', color: '#f39c12', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                                ⏰ {formatRideTime(ride.departure_time)}
                                            </span>
                                        </div>

                                        <div style={{ fontWeight: '700', fontSize: '18px', color: '#333', marginBottom: '15px' }}>
                                            {ride.source} ➔ {ride.destination}
                                        </div>

                                        <div style={{ borderTop: '1px solid #f9f9f9', paddingTop: '15px', flexGrow: 1 }}>
                                            <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>Driver: <strong>{ride.driver_name}</strong></p>
                                            <p style={{ margin: '5px 0', fontSize: '13px', color: '#27ae60', fontWeight: '600' }}>{ride.seats_available} seats available</p>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                            <span style={{ fontSize: '24px', fontWeight: '800', color: '#2c3e50' }}>₹{ride.cost_per_seat}</span>
                                            <button className="btn-primary" onClick={() => handleRequestJoin(ride.ride_id)} disabled={ride.seats_available === 0} style={{ borderRadius: '12px', padding: '10px 25px' }}>
                                                {ride.seats_available > 0 ? 'Join' : 'Full'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {/* Ye section sirf un-logged users ke liye hai */}
                        {!user && <LandingExtraContent />}
                    </>
                )}
            </div>
        </div>
    );
};

export default Home;
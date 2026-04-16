import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';

const RideChat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Previous page se user aur booking ki details lenge
    const bookingId = location.state?.bookingId; 
    const otherPersonName = location.state?.otherPersonName || "User";
    
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [user, setUser] = useState(null);
    
    const chatEndRef = useRef(null); // Auto-scroll ke liye

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (!loggedInUser || !bookingId) {
            navigate('/');
            return;
        }
        setUser(loggedInUser);

        // Messages load karne ka function
        const fetchMessages = async () => {
            try {
                const response = await API.get(`/chat/${bookingId}`);
                setMessages(response.data);
            } catch (error) {
                console.error("Error fetching messages", error);
            }
        };

        fetchMessages(); // Pehli baar load karo

        // Har 3 second mein naye messages check karo (Simulated Real-time)
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval); // Cleanup
    }, [bookingId, navigate]);

    // Naya message aane par auto-scroll down
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await API.post('/chat/send', {
                booking_id: bookingId,
                sender_id: user.user_id,
                message_text: newMessage
            });
            setNewMessage(""); // Input clear karo
            
            // Turant fetch karo bhejte hi
            const response = await API.get(`/chat/${bookingId}`);
            setMessages(response.data);
        } catch (error) {
            alert('Failed to send message');
        }
    };

    if (!user) return null;

    return (
        <div style={{ padding: '20px', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#34495e', padding: '15px', borderRadius: '12px 12px 0 0', color: 'white' }}>
                <h3 style={{ margin: 0 }}>Chat with {otherPersonName} 💬</h3>
                <button onClick={() => navigate(-1)} style={{ backgroundColor: '#e74c3c', padding: '5px 10px', fontSize: '14px' }}>Back</button>
            </div>

            {/* Chat Box Area */}
            <div style={{ height: '400px', backgroundColor: '#ecf0f1', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#7f8c8d', marginTop: '50px' }}>No messages yet. Say Hi! 👋</p>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === user.user_id;
                        return (
                            <div key={msg.message_id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                                <p style={{ fontSize: '12px', margin: '0 0 2px 0', color: '#7f8c8d', textAlign: isMe ? 'right' : 'left' }}>
                                    {isMe ? 'You' : msg.sender_name}
                                </p>
                                <div style={{ 
                                    backgroundColor: isMe ? '#3498db' : '#ffffff', 
                                    color: isMe ? '#ffffff' : '#2c3e50', 
                                    padding: '10px 15px', 
                                    borderRadius: isMe ? '15px 15px 0 15px' : '15px 15px 15px 0',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}>
                                    {msg.message_text}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} /> {/* Dummy div for scrolling */}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', backgroundColor: '#bdc3c7', padding: '15px', borderRadius: '0 0 12px 12px' }}>
                <input 
                    type="text" 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    placeholder="Type a message..." 
                    style={{ flex: 1, padding: '10px', borderRadius: '20px', border: 'none', marginRight: '10px', outline: 'none' }}
                />
                <button type="submit" style={{ backgroundColor: '#2ecc71', padding: '10px 20px', borderRadius: '20px', border: 'none' }}>
                    Send 🚀
                </button>
            </form>
        </div>
    );
};

export default RideChat;
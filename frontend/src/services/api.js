import axios from 'axios';

// Yeh tumhare naye LIVE Render backend ka base URL hai
const API = axios.create({
    baseURL: 'https://campus-ride-zicq.onrender.com/api',
});

export default API;
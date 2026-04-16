import axios from 'axios';

// Yeh tumhare Python backend ka base URL hai
const API = axios.create({
    baseURL: 'http://127.0.0.1:5000/api',
});

export default API;
import axios from 'axios';

const api = axios.create({
    baseURL: "https://flux-wallet-e4cu.onrender.com" || 'http://localhost:8080',
});

export default api;
import axios from 'axios';

// URL DE PRODUCCIÓN (La que te dé Render.com)
// Ejemplo: 'https://control-alcohol-backend.onrender.com/api'
const PROD_URL = 'https://wedding-drinks-api.onrender.com/api'; 

const isProduction = import.meta.env.PROD;
const currentHostname = window.location.hostname;

const baseURL = isProduction 
  ? PROD_URL 
  : `http://${currentHostname}:3000/api`;

const api = axios.create({
  baseURL: baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export default api;

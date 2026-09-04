import axios from 'axios';

const api = axios.create({
  // Use local backend in development, relative URL in production to prevent CORS/www issues
  baseURL: import.meta.env.MODE === 'production' 
    ? '/api/ches' 
    : 'http://localhost:5000/api',
  timeout: 15000, // 15 seconds timeout to prevent indefinite loading
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ches_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token expired or invalid
      localStorage.removeItem('ches_token');
      localStorage.removeItem('ches_user');
      // Only redirect if not already on the login page
      if (!window.location.hash.includes('#/login')) {
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

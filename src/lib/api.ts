import axios from 'axios';

// Colleagues set VITE_API_URL in their .env; see .env.example.
const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  throw new Error('VITE_API_URL is not set. Copy .env.example to .env and set it.');
}

const api = axios.create({
  baseURL: API_URL,
  // A hung backend is the most common production failure mode: a
  // VITE_API_URL that points nowhere, ngrok down, or a dead tunnel.
  // Axios's default timeout is 0 (never), so without this every page
  // would sit on its loading spinner indefinitely. 20s is generous
  // for ngrok + Daraja callbacks but short enough that the user sees
  // a real error and we can fall back gracefully.
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token') ?? localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('staysync-auth');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

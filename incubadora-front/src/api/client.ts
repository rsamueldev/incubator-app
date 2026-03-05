import axios from 'axios';

// API_URL: La dirección base del servidor backend.
const API_URL = import.meta.env.VITE_API_URL;

// apiClient: Instancia personalizada de Axios con configuración base.
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptores: Añade el token de acceso a las peticiones.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- FUNCIONES DE AUTENTICACIÓN ---

export const login = async (user_mail: string, user_password: string) => {
  const response = await apiClient.post('/auth/login', { user_mail, user_password });
  return response.data; // Devuelve { access_token, refresh_token }
};

export const register = async (user_mail: string, user_password: string, user_name: string) => {
  const response = await apiClient.post('/auth/register', { user_mail, user_password, user_name });
  return response.data;
};

// --- FUNCIONES DE DISPOSITIVOS ---

export const getUserDevices = async () => {
  const response = await apiClient.get('/devices');
  return response.data;
};

export const linkDevice = async (device_id: string, device_name: string) => {
  const response = await apiClient.post('/devices/link', { device_id, device_name });
  return response.data;
};

// --- FUNCIONES DE LECTURAS ---

export const getLatestReading = async (deviceId: string) => {
  const response = await apiClient.get(`/readings/latest/${deviceId}`);
  return response.data;
};

export const getHistory = async (deviceId: string) => {
  const response = await apiClient.get(`/readings/history/${deviceId}`);
  return response.data;
};

// --- FUNCIONES DE ALERTAS ---

export const getAlerts = async (deviceId: string) => {
  const response = await apiClient.get(`/alerts/${deviceId}`);
  return response.data;
};
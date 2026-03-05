import axios from 'axios';

// API_URL: La dirección base de tu servidor backend.
// Usamos import.meta.env para leer desde el archivo .env (VITE_API_URL)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * ¿Qué es Axios?
 * Axios es una librería cliente HTTP que nos permite hacer peticiones (GET, POST, etc.) 
 * a un servidor de forma sencilla. Maneja automáticamente la conversión a JSON y 
 * nos permite configurar comportamientos globales.
 */

/**
 * ¿Qué es apiClient?
 * Es una "instancia" personalizada de Axios. Al crearla, le definimos una configuración
 * base (como el baseURL) para no tener que escribir la URL completa en cada petición.
 */
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptores: El "peaje" de las peticiones.
 * Antes de que CUALQUIER petición salga al servidor, este interceptor se ejecuta.
 * Aquí buscamos el token de acceso en el localStorage y, si existe, lo añadimos
 * automáticamente al encabezado Authorization de la petición.
 */
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
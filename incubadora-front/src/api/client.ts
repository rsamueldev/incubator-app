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

// Refresh logic variables
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void, reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Interceptor de Respuestas: Para atrapar 401 (Token Expirado) y refrescar la sesión
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no hemos re-intentado la petición ya
    if (error.response?.status === 401 && !originalRequest._retry) {

      // Si el error de 401 proviene del mismo endpoint de refresh, significa que el refresh token expiró
      // Hay que desloguear al usuario
      if (originalRequest.url === '/auth/refresh') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.reload(); // Fuerza a React a devolverte al Login
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Poner en cola requests adicionales mientras se refresca el token
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        })
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      return new Promise(function (resolve, reject) {
        axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken })
          .then(({ data }) => {
            // Guardar nuevos tokens
            localStorage.setItem('access_token', data.access_token);
            if (data.refresh_token) {
              localStorage.setItem('refresh_token', data.refresh_token);
            }
            apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + data.access_token;
            originalRequest.headers.Authorization = 'Bearer ' + data.access_token;
            processQueue(null, data.access_token);
            resolve(apiClient(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.reload();
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

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

export const exportCSV = async (deviceId: string) => {
  const response = await apiClient.get(`/readings/export/${deviceId}`, {
    responseType: 'blob', // Importante para manejar archivos
  });
  return response.data;
};

// --- FUNCIONES DE ALERTAS ---

export const getAlerts = async (deviceId: string) => {
  const response = await apiClient.get(`/alerts/${deviceId}`);
  return response.data;
};
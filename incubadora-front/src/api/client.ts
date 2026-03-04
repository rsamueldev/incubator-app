import axios from 'axios';

// Esta es la dirección de tu backend NestJS
const API_URL = 'http://localhost:3000'; 

const apiClient = axios.create({
  baseURL: API_URL,
});

// Función para traer la temperatura y humedad más reciente
export const getLatestReading = async (id: string) => {
  const response = await apiClient.get(`/devices/${id}/latest`);
  return response.data;
};

// Función para traer todo el historial para el gráfico
export const getHistory = async (id: string) => {
  const response = await apiClient.get(`/devices/${id}/history`);
  return response.data;
};
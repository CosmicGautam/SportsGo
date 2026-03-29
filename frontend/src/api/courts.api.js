// src/api/courts.api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const courtsAPI = axios.create({
  baseURL: `${API_BASE_URL}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
courtsAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (!token) {
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`;
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ------------------ Public / Admin ------------------

// Get all courts
export const getAllCourts = async () => {
  try {
    const response = await courtsAPI.get('/courts');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch courts' };
  }
};

// Get court by ID
export const getCourtById = async (courtId) => {
  try {
    const response = await courtsAPI.get(`/courts/${courtId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch court' };
  }
};

// ------------------ Provider-specific ------------------

// Get courts owned by provider
export const getMyCourts = async () => {
  try {
    const response = await courtsAPI.get('/provider/my-courts');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch your courts' };
  }
};

// Create a court (provider)
export const createCourt = async (courtData) => {
  try {
    const response = await courtsAPI.post('/provider/courts', courtData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create court' };
  }
};

// Update a court (provider)
export const updateCourt = async (courtId, courtData) => {
  try {
    const response = await courtsAPI.put(`/provider/courts/${courtId}`, courtData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update court' };
  }
};

// Delete a court (provider)
export const deleteCourt = async (courtId) => {
  try {
    const response = await courtsAPI.delete(`/provider/courts/${courtId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete court' };
  }
};

export default courtsAPI;
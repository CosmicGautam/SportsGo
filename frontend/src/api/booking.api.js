// src/api/bookings.api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const bookingsAPI = axios.create({
  baseURL: `${API_BASE_URL}/bookings`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
bookingsAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Try to get from auth object
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      if (auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
      }
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors
bookingsAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Get available slots for a court on a specific date
export const getSlots = async (courtId, date) => {
  try {
    const response = await bookingsAPI.get('/slots', {
      params: { courtId, date },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch slots' };
  }
};

// Create a new booking
export const createBooking = async (bookingData) => {
  try {
    const response = await bookingsAPI.post('/', bookingData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create booking' };
  }
};

// Get user's bookings
export const getUserBookings = async () => {
  try {
    const response = await bookingsAPI.get('/user');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch bookings' };
  }
};

// Get all bookings (admin only) - ONLY ONE DECLARATION
export const getAllBookings = async () => {
  try {
    const response = await bookingsAPI.get('/all');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch all bookings' };
  }
};

// Cancel booking
export const cancelBooking = async (bookingId) => {
  try {
    const response = await bookingsAPI.delete(`/${bookingId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to cancel booking' };
  }
};

export const getBookingById = async (bookingId) => {
  try {
    const response = await bookingsAPI.get(`/${bookingId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch booking' };
  }
};

export default bookingsAPI;
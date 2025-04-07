// services/authService.js
import api from './api';

// Register user
export const register = async (userData) => {
  try {
    const formattedData = {
      name: userData.name,
      phoneNumber: userData.phone, // This is the key fix - matching the field name
      nationalId: userData.nationalId || userData.phone, // Fallback if nationalId not provided
      password: userData.password,
      role: 'employer', // You can make this dynamic later
      location: {
        county: 'Bungoma',
        subCounty: 'Kanduyi',
        village: userData.village || 'Musikoma'
      }
    };

    console.log('Sending registration data:', formattedData);
    
    const response = await api.post('/auth/register', formattedData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      return response.data;
    }
    
    throw new Error('Registration failed. No token received.');
  } catch (err) {
    console.error('Registration error:', err);
    throw new Error(err.response?.data?.error || 'Registration failed');
  }
};

// Login user
export const login = async (userData) => {
  try {
    const loginData = {
      phoneNumber: userData.phone, // This is the key fix - matching the field name
      password: userData.password
    };

    console.log('Sending login data:', loginData);
    
    const response = await api.post('/auth/login', loginData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      return response.data;
    }
    
    throw new Error('Login failed. No token received.');
  } catch (err) {
    console.error('Login error:', err);
    throw new Error(err.response?.data?.error || 'Invalid credentials');
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

// Logout user
export const logout = () => {
  localStorage.removeItem('token');
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data.data;
  } catch (err) {
    console.error('Get current user error:', err);
    return null;
  }
};
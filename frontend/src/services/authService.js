// services/authService.js
import api from './api';

// Register a new user
export const register = async (userData) => {
  try {
    // Format the data to match backend expectations
    const formattedData = {
      name: userData.name,
      phoneNumber: userData.phone,
      nationalId: userData.nationalId || '12345678', // You might want to add this to your form
      password: userData.password,
      role: 'tasker', // Default to tasker role, you can make this dynamic later
      location: {
        county: 'Default County', // These should be dropdown selections in your form
        subCounty: 'Default SubCounty',
        village: userData.village
      }
    };

    // If there are skills, add them
    if (userData.skills && userData.skills.length > 0) {
      formattedData.skills = userData.skills;
    }

    const response = await api.post('/v1/auth/register', formattedData);
    
    // Store the token in localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      return response.data;
    }
    
    throw new Error('Registration failed. No token received.');
  } catch (err) {
    console.error('Register error:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error || 'Registration failed');
  }
};

// Login user
export const login = async (userData) => {
  try {
    const response = await api.post('/v1/auth/login', {
      phoneNumber: userData.phone,
      password: userData.password
    });
    
    // Store the token in localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      return response.data;
    }
    
    throw new Error('Login failed. No token received.');
  } catch (err) {
    console.error('Login error:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error || 'Invalid credentials');
  }
};

// Logout user
export const logout = () => {
  localStorage.removeItem('token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

// Get current user's profile
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/v1/auth/me');
    return response.data.data;
  } catch (err) {
    console.error('Get current user error:', err.response?.data || err.message);
    return null;
  }
};
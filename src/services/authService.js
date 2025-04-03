import api from '../utils/api';

// Register user
export const register = async (userData) => {
  try {
    const response = await api.post('/users/register', userData);
    if (response?.data?.token) {
      localStorage.setItem('token', response?.data?.token);
    }
    return response?.data;
  } catch (err) {
    console.log(err?.response?.data);
  }
};

// Login user
export const login = async (userData) => {
  try {
    const response = await api.post('/users/login', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (err) {
    throw err.response.data;
  }
};

// Logout user
export const logout = () => {
  localStorage.removeItem('token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return localStorage.getItem('token') ? true : false;
};
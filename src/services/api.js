import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const auth = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  login: async (data) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// Assessment API
export const assessment = {
  save: async (data) => {
    try {
      const response = await api.post('/assessments', data);
      return response.data;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },
  getHistory: async (type = null) => {
    try {
      const params = type ? { type } : {};
      const response = await api.get('/assessments/history', { params });
      return response.data.data;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },
  getBaseline: async (type) => {
    try {
      const response = await api.get('/assessments/baseline', { params: { type } });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { data: null };
      }
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },
  delete: async (id) => {
    const response = await api.delete(`/assessments/${id}`);
    return response.data;
  }
};

export default api; 
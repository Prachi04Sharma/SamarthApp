import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      // Don't redirect if we're already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const auth = {
  register: async (data) => {
    try {
      console.log('Sending registration data:', {
        ...data,
        password: '[REDACTED]'
      });
      
      const response = await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName
      });
      
      console.log('Registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error.response?.data || error;
    }
  },
  login: async (data) => {
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password
      });
      console.log('Login API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.get('/auth/me');
      
      if (!response.data || !response.data.success || !response.data.user) {
        throw new Error('Invalid response format from server');
      }

      return response.data.user;
    } catch (error) {
      console.error('Get current user error:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
      }
      
      throw error;
    }
  }
};

// Assessment API
export const assessment = {
  save: async (data) => {
    try {
      const response = await api.post('/assessments', data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      console.error('API Error:', error.response?.data);
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

export const assessmentService = {
  async saveAssessment(assessmentData) {
    try {
      const response = await api.post('/assessments', assessmentData);
      return response.data;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  }
};

export const specializedAssessments = {
  eyeMovement: {
    save: async (data) => {
      try {
        const response = await api.post('/specialized-assessments/eye-movement', data);
        return response; // Return the full Axios response object
      } catch (error) {
        console.error('API Error in eyeMovement.save:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      }
    },
    getHistory: (userId, limit) => api.get('/specialized-assessments/eye-movement/history', { params: { userId, limit } }),
    getBaseline: (userId) => api.get(`/specialized-assessments/eye-movement/baseline/${userId}`)
  },
  neckMobility: {
    save: async (data) => {
      try {
        const response = await api.post('/specialized-assessments/neck-mobility', data);
        return response; // Return the full response object
      } catch (error) {
        console.error('API Error in neckMobility.save:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      }
    },
    getHistory: (userId, limit) => api.get('/specialized-assessments/neck-mobility/history', { params: { userId, limit } }),
    getBaseline: (userId) => api.get(`/specialized-assessments/neck-mobility/baseline/${userId}`)
  },
  facialSymmetry: {
    save: (data) => api.post('/specialized-assessments/facial-symmetry', data),
    getHistory: (userId) => api.get(`/specialized-assessments/facial-symmetry/history/${userId}`),
    getBaseline: (userId) => api.get(`/specialized-assessments/facial-symmetry/baseline/${userId}`)
      .catch(error => {
        if (error.response?.status === 404) {
          // Return empty data if no baseline exists
          return { data: { success: true, data: null } };
        }
        throw error;
      })
  },
  // Add new tremor assessment API
  tremor: {
    save: async (data) => {
      try {
        const response = await api.post('/specialized-assessments/tremor', data);
        return response; // Return the full Axios response object
      } catch (error) {
        console.error('API Error in tremor.save:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      }
    },
    getHistory: (userId, limit) => api.get('/specialized-assessments/tremor/history', { params: { userId, limit } }),
    getBaseline: (userId) => api.get(`/specialized-assessments/tremor/baseline/${userId}`)
  },
  responseTime: {
    save: async (data) => {
      try {
        const response = await api.post('/specialized-assessments/response-time', data);
        return response; // Return the full Axios response object
      } catch (error) {
        console.error('API Error in responseTime.save:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      }
    },
    getHistory: (userId, limit) => api.get('/specialized-assessments/response-time/history', { params: { userId, limit } }),
    getBaseline: (userId) => api.get(`/specialized-assessments/response-time/baseline/${userId}`)
  },
  gaitAnalysis: {
    save: async (data) => {
      try {
        const response = await api.post('/specialized-assessments/gait-analysis', data);
        return response; // Return the full Axios response object
      } catch (error) {
        console.error('API Error in gaitAnalysis.save:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      }
    },
    getHistory: (userId, limit) => api.get('/specialized-assessments/gait-analysis/history', { params: { userId, limit } }),
    getBaseline: (userId) => api.get(`/specialized-assessments/gait-analysis/baseline/${userId}`)
  },
  fingerTapping: {
    save: async (data) => {
      try {
        const response = await api.post('/specialized-assessments/finger-tapping', data);
        return response; // Return the full Axios response object
      } catch (error) {
        console.error('API Error in fingerTapping.save:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      }
    },
    getHistory: (userId, limit) => api.get('/specialized-assessments/finger-tapping/history', { params: { userId, limit } }),
    getBaseline: (userId) => api.get(`/specialized-assessments/finger-tapping/baseline/${userId}`)
  },
  speechPattern: {
    save: async (data) => {
      try {
        const response = await api.post('/specialized-assessments/speech-pattern', data);
        return response; // Return the full Axios response object
      } catch (error) {
        console.error('API Error in speechPattern.save:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      }
    },
    getHistory: (userId, limit) => api.get('/specialized-assessments/speech-pattern/history', { params: { userId, limit } }),
    getBaseline: (userId) => api.get(`/specialized-assessments/speech-pattern/baseline/${userId}`)
  }
};

export { api };
export default api;
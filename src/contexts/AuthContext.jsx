import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext(null);

const getStoredToken = () => localStorage.getItem('token');
const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        console.log('Initializing auth with stored token');
        const userData = await auth.getCurrentUser();
        if (userData) {
          console.log('User data fetched successfully:', userData.email);
          setUser(userData);
        } else {
          console.log('No user data returned');
          setStoredToken(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error.message);
        // Clear token only on auth errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Invalid token detected, clearing auth state');
          setStoredToken(null);
          setUser(null);
        }
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await auth.login(credentials);
      const { token, user: userData } = response;
      
      if (token && userData) {
        setStoredToken(token);
        setUser(userData);
        return userData;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error.message);
      setError(error.message);
      throw error;
    }
  };

  const signup = async (email, password, profile) => {
    try {
      setError(null);
      const response = await auth.register({
        email,
        password,
        firstName: profile.firstName,
        lastName: profile.lastName
      });
      
      if (response.success && response.token && response.user) {
        setStoredToken(response.token);
        setUser(response.user);
        return response;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Signup error:', error.message);
      setError(error.message);
      throw error;
    }
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
    setError(null);
  };

  // Debug auth state changes
  useEffect(() => {
    console.log('Auth state changed:', { 
      isAuthenticated: !!user, 
      hasToken: !!getStoredToken(),
      loading,
      error: error || 'none'
    });
  }, [user, loading, error]);

  const value = {
    user,
    login,
    logout,
    signup,
    loading,
    error,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider; 
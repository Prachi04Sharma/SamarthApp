import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  Paper,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({
        email: email.trim(),
        password: password
      });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      bgcolor: '#0a192f', // Deep blue futuristic background
      p: 2
    }}>
      <Paper sx={{ 
        p: 4, 
        maxWidth: 400, 
        width: '100%',
        backdropFilter: 'blur(10px)', 
        background: 'rgba(255, 255, 255, 0.1)', 
        borderRadius: 3, 
        boxShadow: '0px 0px 15px rgba(0, 255, 255, 0.2)'
      }}>
        <Typography 
          variant="h5" 
          component="h1" 
          gutterBottom
          sx={{ textAlign: 'center', color: '#00e5ff' }}
        >
          Login
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            InputProps={{ style: { color: '#fff' } }}
            sx={{
              input: { color: '#ffffff' },
              label: { color: '#9ca3af' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#3b82f6' },
                '&:hover fieldset': { borderColor: '#60a5fa' },
                '&.Mui-focused fieldset': { borderColor: '#93c5fd' }
              }
            }}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{ style: { color: '#fff' } }}
            sx={{
              input: { color: '#ffffff' },
              label: { color: '#9ca3af' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#3b82f6' },
                '&:hover fieldset': { borderColor: '#60a5fa' },
                '&.Mui-focused fieldset': { borderColor: '#93c5fd' }
              }
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ 
              mt: 2, 
              bgcolor: '#00e5ff', 
              color: '#000', 
              '&:hover': { bgcolor: '#00c3e3' }, 
              fontWeight: 'bold', 
              boxShadow: '0px 0px 10px rgba(0, 255, 255, 0.5)'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
              Don't have an account?{' '}
              <Link component={RouterLink} to="/signup" sx={{ color: '#00e5ff' }}>
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;

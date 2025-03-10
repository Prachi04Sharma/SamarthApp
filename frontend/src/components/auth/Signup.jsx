import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      return setError("Passwords don't match");
    }

    try {
      setLoading(true);
      await signup(email, password, { firstName, lastName });
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      setError(
        error.message || 
        (error.errors ? Object.values(error.errors).join(', ') : 'Failed to create account')
      );
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
      bgcolor: '#0f172a',
      backgroundImage: 'radial-gradient(circle, rgba(10,10,25,0.8) 0%, rgba(15,23,42,1) 100%)',
      p: 2
    }}>
      <Paper sx={{ 
        p: 4, 
        maxWidth: 450, 
        width: '100%', 
        borderRadius: 3, 
        backdropFilter: 'blur(10px)',
        background: 'rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        color: '#ffffff'
      }}>
        <Typography variant="h4" component="h1" gutterBottom textAlign="center" sx={{ color: '#ffffff' }}>
          Sign Up
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(255, 0, 0, 0.2)', color: '#ff4d4d' }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="First Name"
            name="firstName"
            fullWidth
            margin="normal"
            value={formData.firstName}
            onChange={handleChange}
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
            label="Last Name"
            name="lastName"
            fullWidth
            margin="normal"
            value={formData.lastName}
            onChange={handleChange}
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
            label="Email"
            name="email"
            type="email"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={handleChange}
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
            name="password"
            type="password"
            fullWidth
            margin="normal"
            value={formData.password}
            onChange={handleChange}
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
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            fullWidth
            margin="normal"
            value={formData.confirmPassword}
            onChange={handleChange}
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
              mt: 3, 
              p: 1.5,
              fontSize: '1rem',
              background: 'linear-gradient(45deg, #2563eb, #9333ea)',
              '&:hover': { background: 'linear-gradient(45deg, #1d4ed8, #7e22ce)' }
            }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" sx={{ color: '#3b82f6' }}>
                Login
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Signup;
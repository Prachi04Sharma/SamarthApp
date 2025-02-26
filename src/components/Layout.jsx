import { Box, AppBar, Toolbar, Typography, IconButton, Avatar, Button } from '@mui/material';
import { Menu as MenuIcon, Notifications, Settings as SettingsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/home')}
          >
            Samarth App
          </Typography>
          <IconButton 
            color="inherit"
            onClick={() => navigate('/settings')}
          >
            <SettingsIcon />
          </IconButton>
          <IconButton color="inherit">
            <Notifications />
          </IconButton>
          <Avatar 
            sx={{ ml: 2, cursor: 'pointer' }}
            onClick={() => navigate('/profile')}
          >
            {currentUser?.email?.charAt(0).toUpperCase()}
          </Avatar>
          <Button color="inherit" onClick={handleLogout} sx={{ ml: 2 }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 
import { useState } from 'react';
import { Box, Paper, Tabs, Tab } from '@mui/material';
import Login from './Login';
import Signup from './Signup';

const AuthPage = () => {
  const [tab, setTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      bgcolor: 'background.default',
      p: 2
    }}>
      <Paper sx={{ 
        maxWidth: 400, 
        width: '100%',
        borderRadius: 2,
        boxShadow: 3
      }}>
        <Tabs 
          value={tab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Login" />
          <Tab label="Sign Up" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 ? <Login /> : <Signup />}
        </Box>
      </Paper>
    </Box>
  );
};

export default AuthPage; 
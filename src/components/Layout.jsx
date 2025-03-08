import React, { useState, useEffect } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  Button
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Notifications, 
  Settings,
  Dashboard as DashboardIcon,
  Assessment,
  Analytics,
  Person,
  ExitToApp,
  ChevronRight,
  BugReport as BugReportIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Add avatar options - should be the same as in Profile.jsx
// This could be moved to a shared config file in the future
const avatarOptions = [
  { id: 'default', url: '/avatars/default.png', name: 'Default' },
  { id: 'avatar1', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix', name: 'Robot 1' },
  { id: 'avatar2', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aneka', name: 'Robot 2' },
  { id: 'avatar3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight', name: 'Person 1' },
  { id: 'avatar4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna', name: 'Person 2' },
  { id: 'avatar5', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Felix', name: 'Minimal 1' },
  { id: 'avatar6', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Coco', name: 'Minimal 2' },
  { id: 'avatar7', url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Daisy', name: 'Thumb 1' },
  { id: 'avatar8', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Pepper', name: 'Portrait 1' }
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State for menus
  const [profileMenu, setProfileMenu] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState('');

  // New useEffect to fetch avatar from localStorage
  useEffect(() => {
    if (user?.id) {
      // First check localStorage for avatar URL
      const savedAvatarUrl = localStorage.getItem(`avatarUrl_${user.id}`);
      
      if (savedAvatarUrl) {
        setUserAvatar(savedAvatarUrl);
      } else {
        // If no URL directly saved, check for avatar ID
        const savedAvatarId = localStorage.getItem(`avatar_${user.id}`);
        if (savedAvatarId) {
          const avatarObj = avatarOptions.find(a => a.id === savedAvatarId);
          setUserAvatar(avatarObj?.url || '');
        } else {
          // Fall back to user's profile pic if available
          setUserAvatar(user?.profilePic || user?.profile?.avatarUrl || '');
        }
      }
    } else {
      setUserAvatar('');
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Assessments', icon: <Assessment />, path: '/assessment' },
    { text: 'Analytics', icon: <Analytics />, path: '/analytics' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  // Add diagnostics link only in development mode
  if (import.meta.env.DEV) {
    menuItems.push({
      text: 'Diagnostics',
      icon: <BugReportIcon />,
      path: '/diagnostics'
    });
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
        }}
      >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              fontWeight: 'bold',
              '&:hover': {
                opacity: 0.8
              }
            }}
            onClick={() => navigate('/dashboard')}
          >
            Samarth App
          </Typography>

          <IconButton 
            color="inherit"
            sx={{ 
              mr: 1,
              '&:hover': { background: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <Notifications />
          </IconButton>

          <IconButton 
            onClick={(e) => setProfileMenu(e.currentTarget)}
            sx={{ 
              ml: 1,
              '&:hover': { background: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40,
                border: '2px solid white'
              }}
              alt={user?.name || 'User'} 
              src={userAvatar || user?.profilePic}
            >
              {user?.name?.[0] || user?.email?.[0] || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={profileMenu}
            open={Boolean(profileMenu)}
            onClose={() => setProfileMenu(null)}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                boxShadow: '0px 8px 16px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => {
              navigate('/profile');
              setProfileMenu(null);
            }}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => {
              handleLogout();
              setProfileMenu(null);
            }}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            background: theme.palette.background.default,
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem 
                button 
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  setDrawerOpen(false);
                }}
                sx={{
                  borderRadius: '0 50px 50px 0',
                  mr: 2,
                  mb: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          mt: 8,
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
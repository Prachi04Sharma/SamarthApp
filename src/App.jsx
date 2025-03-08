import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';

// Auth components
import Login from './components/auth/Login';
import Register from './components/auth/Signup';

// Pages and components
import Dashboard from './components/Dashboard';
import Profile from './pages/Profile';
import Assessment from './pages/Assessment';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Diagnostics from './pages/Diagnostics';
import ProtectedRoute from './components/routing/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <SnackbarProvider maxSnack={3}>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/assessment/*" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/diagnostics" element={<ProtectedRoute><Diagnostics /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </SnackbarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

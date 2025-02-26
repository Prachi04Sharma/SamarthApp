import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import AuthProvider from './contexts/AuthContext';
import ThemeProvider from './contexts/ThemeContext';

// Auth Components
import PrivateRoute from './components/auth/PrivateRoute';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';

// Pages
import Home from './pages/Home';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Camera from './pages/Camera';
import Assessment from './pages/Assessment';
import NotFound from './pages/NotFound';

// Assessment Components
import EyeMovement from './components/assessments/EyeMovement';
import NeckMobility from './components/assessments/NeckMobility';
import FacialSymmetry from './components/assessments/FacialSymmetry';
import Tremor from './components/assessments/Tremor';
import ResponseTime from './components/assessments/ResponseTime';
import GaitAnalysis from './components/assessments/GaitAnalysis';
import FingerTapping from './components/assessments/FingerTapping';
import { Dashboard } from '@mui/icons-material';

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/home" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard/>} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/camera" element={<Camera />} />
              
              {/* Assessment Routes */}
              <Route path="/assessment" element={<Assessment />} />
              <Route path="/assessment/eye-movement" element={<EyeMovement />} />
              <Route path="/assessment/neck-mobility" element={<NeckMobility />} />
              <Route path="/assessment/facial-symmetry" element={<FacialSymmetry />} />
              <Route path="/assessment/tremor" element={<Tremor />} />
              <Route path="/assessment/response-time" element={<ResponseTime />} />
              <Route path="/assessment/gait-analysis" element={<GaitAnalysis />} />
              <Route path="/assessment/finger-tapping" element={<FingerTapping />} />
            </Route>

            {/* Redirect root to home */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            
            {/* Catch all unmatched routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import ThemeProvider from './contexts/ThemeContext';

// Auth Components
import PrivateRoute from './components/auth/PrivateRoute';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Camera from './pages/Camera';
import Assessment from './pages/Assessment';
import NotFound from './pages/NotFound';
import Dashboard from './components/Dashboard';

// Assessment Components
import EyeMovement from './components/assessments/EyeMovement';
import NeckMobility from './components/assessments/NeckMobility';
import FacialSymmetry from './components/assessments/FacialSymmetry';
import Tremor from './components/assessments/Tremor';
import ResponseTime from './components/assessments/ResponseTime';
import GaitAnalysis from './components/assessments/GaitAnalysis';
import FingerTapping from './components/assessments/FingerTapping';

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
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/assessment" element={
              <ProtectedRoute>
                <Assessment />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            
            <Route path="/camera" element={
              <ProtectedRoute>
                <Camera />
              </ProtectedRoute>
            } />
            
            {/* Assessment Routes - Also protect these */}
            <Route path="/assessment/eye-movement" element={
              <ProtectedRoute>
                <EyeMovement />
              </ProtectedRoute>
            } />
            <Route path="/assessment/neck-mobility" element={
              <ProtectedRoute>
                <NeckMobility />
              </ProtectedRoute>
            } />
            <Route path="/assessment/facial-symmetry" element={
              <ProtectedRoute>
                <FacialSymmetry />
              </ProtectedRoute>
            } />
            <Route path="/assessment/tremor" element={
              <ProtectedRoute>
                <Tremor />
              </ProtectedRoute>
            } />
            <Route path="/assessment/response-time" element={
              <ProtectedRoute>
                <ResponseTime />
              </ProtectedRoute>
            } />
            <Route path="/assessment/gait-analysis" element={
              <ProtectedRoute>
                <GaitAnalysis />
              </ProtectedRoute>
            } />
            <Route path="/assessment/finger-tapping" element={
              <ProtectedRoute>
                <FingerTapping />
              </ProtectedRoute>
            } />

            {/* Update root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all unmatched routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

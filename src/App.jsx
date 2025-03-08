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
import Therapies from './pages/Therapies';
import ParkinsonsTherapy from './pages/therapies/ParkinsonsTherapy';
import BellsPalsyTherapy from './pages/therapies/BellsPalsyTherapy';
import ALSTherapy from './pages/therapies/ALSTherapy';
import ParkinsonsPhysicalTherapy from './pages/therapies/parkinsons/PhysicalTherapy';
import ParkinsonsSpeechTherapy from './pages/therapies/parkinsons/SpeechTherapy';
import ParkinsonsOccupationalTherapy from './pages/therapies/parkinsons/OccupationalTherapy';
import BellsPalsyPhysicalTherapy from './pages/therapies/bells-palsy/PhysicalTherapy';
import ALSPhysicalTherapy from './pages/therapies/als/PhysicalTherapy';
import PhysicalTherapy from './pages/therapies/parkinsons/PhysicalTherapy';
import ALSSpeechTherapy from './pages/therapies/als/SpeechTherapy';
import ALSOccupationalTherapy from './pages/therapies/als/OccupationalTherapy';
import BellsPalsySpeechTherapy from './pages/therapies/bells-palsy/SpeechTherapy';
import BellsPalsyOccupationalTherapy from './pages/therapies/bells-palsy/OccupationalTherapy';

// Assessment Components
import EyeMovement from './components/assessments/EyeMovement/EyeMovementTest';
import NeckMobility from './components/assessments/NeckMobility';
import FacialSymmetry from './components/assessments/FacialSymmetry';
import Tremor from './components/assessments/Tremor';
import ResponseTime from './components/assessments/ResponseTime';
import GaitAnalysis from './components/assessments/GaitAnalysis';
import FingerTapping from './components/assessments/FingerTapping';
import React from 'react';
import TherapyDetail from './components/therapies/TherapyDetail';
import SpeechTherapy from './pages/therapies/parkinsons/SpeechTherapy';
import OccupationalTherapy from './pages/therapies/parkinsons/OccupationalTherapy';

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

            <Route path="/therapies" element={
              <ProtectedRoute>
                <Therapies />
              </ProtectedRoute>
            } />
            
            <Route path="/therapies/parkinsons" element={
              <ProtectedRoute>
                <ParkinsonsTherapy />
              </ProtectedRoute>
            } />
            
            <Route path="/therapies/bells-palsy" element={
              <ProtectedRoute>
                <BellsPalsyTherapy />
              </ProtectedRoute>
            } />
            
            <Route path="/therapies/als" element={
              <ProtectedRoute>
                <ALSTherapy />
              </ProtectedRoute>
            } />

            <Route path="/therapies/parkinsons/physical" element={
              <ProtectedRoute>
                <PhysicalTherapy />
              </ProtectedRoute>
            } />
            <Route path="/therapies/parkinsons/speech" element={
              <ProtectedRoute>
                <ParkinsonsSpeechTherapy />
              </ProtectedRoute>
            } />
            <Route path="/therapies/parkinsons/occupational" element={
              <ProtectedRoute>
                <ParkinsonsOccupationalTherapy />
              </ProtectedRoute>
            } />

            {/* Bell's Palsy Routes */}
            <Route path="/therapies/bells-palsy/physical" element={
              <ProtectedRoute>
                <BellsPalsyPhysicalTherapy />
              </ProtectedRoute>
            } />
            <Route path="/therapies/bells-palsy/speech" element={
              <ProtectedRoute>
                <BellsPalsySpeechTherapy />
              </ProtectedRoute>
            } />
            <Route path="/therapies/bells-palsy/occupational" element={
              <ProtectedRoute>
                <BellsPalsyOccupationalTherapy />
              </ProtectedRoute>
            } />
            
            {/* ALS Routes */}
            <Route path="/therapies/als/physical" element={
              <ProtectedRoute>
                <ALSPhysicalTherapy />
              </ProtectedRoute>
            } />
            <Route path="/therapies/als/speech" element={
              <ProtectedRoute>
                <ALSSpeechTherapy />
              </ProtectedRoute>
            } />
            <Route path="/therapies/als/occupational" element={
              <ProtectedRoute>
                <ALSOccupationalTherapy />
              </ProtectedRoute>
            } />

            {/* Update root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all unmatched routes */}
            <Route path="*" element={<NotFound />} />

            {/* Main therapy routes */}
            <Route path="/therapies" element={
              <ProtectedRoute>
                <Therapies />
              </ProtectedRoute>
            } />

            {/* Parkinson's routes */}
            <Route path="/therapies/parkinsons/*" element={
              <ProtectedRoute>
                <ParkinsonsTherapy />
              </ProtectedRoute>
            } />

            {/* Bell's Palsy routes */}
            <Route path="/therapies/bells-palsy/*" element={
              <ProtectedRoute>
                <BellsPalsyTherapy />
              </ProtectedRoute>
            } />

            {/* ALS routes */}
            <Route path="/therapies/als/*" element={
              <ProtectedRoute>
                <ALSTherapy />
              </ProtectedRoute>
            } />

            {/* Individual therapy pages */}
            <Route path="/therapies/:condition/:type" element={
              <ProtectedRoute>
                <TherapyDetail />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

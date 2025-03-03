import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card, CardContent, Grid, IconButton, Tooltip, Badge } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  RemoveRedEye as EyeIcon,
  AccessibilityNew as MobilityIcon,
  Face as FaceIcon,
  Vibration as TremorIcon,
  Timer as TimerIcon,
  DirectionsWalk as WalkIcon,
  TouchApp as TapIcon,
  ArrowBack as BackIcon,
  Mic as MicIcon
} from '@mui/icons-material';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

// Import assessment components
import EyeMovement from '../components/assessments/EyeMovement/EyeMovementTest';
import NeckMobility from '../components/assessments/NeckMobility';
import FacialSymmetry from '../components/assessments/FacialSymmetry';
import Tremor from '../components/assessments/Tremor';
import ResponseTime from '../components/assessments/ResponseTime';
import GaitAnalysis from '../components/assessments/GaitAnalysis';
import FingerTapping from '../components/assessments/FingerTapping';
import SpeechPatternAssessment from '../components/assessments/SpeechPatternAssessment';

const Assessment = () => {
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [completedAssessments, setCompletedAssessments] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Helper to check if all assessments are completed
  const checkAllAssessmentsCompleted = useCallback((completed, types) => {
    return types.every(assessment => completed.includes(assessment.id));
  }, []);

  // Load completed assessments from localStorage on component mount
  useEffect(() => {
    if (user) {
      // Get the current session flag
      const isNewSession = localStorage.getItem(`new_assessment_session_${user.id}`);
      
      // If starting a new assessment session, clear previous completed assessments
      if (isNewSession === 'true') {
        localStorage.removeItem(`completed_assessments_${user.id}`);
        localStorage.setItem(`new_assessment_session_${user.id}`, 'false');
        setCompletedAssessments([]);
      } else {
        // Otherwise load any existing progress
        const saved = localStorage.getItem(`completed_assessments_${user.id}`);
        if (saved) {
          try {
            setCompletedAssessments(JSON.parse(saved));
          } catch (e) {
            console.error('Failed to parse completed assessments', e);
          }
        }
      }
    }
  }, [user]);

  // Add loading state for user
  if (!user) {
    return (
      <Layout>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography>Please log in to access assessments</Typography>
        </Box>
      </Layout>
    );
  }

  const assessmentTypes = [
    {
      id: 'eyeMovement',
      title: 'Eye Movement Assessment',
      description: 'Track eye movements to detect potential neurological disorders.',
      icon: EyeIcon,
      component: EyeMovement,
      route: '/assessment/eye-movement'
    },
    {
      id: 'neckMobility',
      title: 'Neck Mobility Assessment',
      description: 'Assess neck mobility and flexibility patterns.',
      icon: MobilityIcon,
      component: NeckMobility,
      route: '/assessment/neck-mobility'
    },
    {
      id: 'facialSymmetry',
      title: 'Facial Symmetry Assessment',
      description: 'Analyze facial symmetry and muscle balance.',
      icon: FaceIcon,
      component: FacialSymmetry,
      route: '/assessment/facial-symmetry'
    },
    {
      id: 'tremor',
      title: 'Tremor Assessment',
      description: 'Measure tremor frequency and amplitude patterns.',
      icon: TremorIcon,
      component: Tremor,
      route: '/assessment/tremor'
    },
    {
      id: 'responseTime',
      title: 'Response Time Assessment',
      description: 'Evaluate reaction time and response patterns.',
      icon: TimerIcon,
      component: ResponseTime,
      route: '/assessment/response-time'
    },
    {
      id: 'gaitAnalysis',
      title: 'Gait Analysis',
      description: 'Analyze walking patterns and balance.',
      icon: WalkIcon,
      component: GaitAnalysis,
      route: '/assessment/gait-analysis'
    },
    {
      id: 'fingerTapping',
      title: 'Finger Tapping Test',
      description: 'Evaluate finger movement patterns and coordination.',
      icon: TapIcon,
      component: FingerTapping,
      route: '/assessment/finger-tapping'
    },
    {
      id: 'speechPattern',
      title: 'Speech Pattern Assessment',
      description: 'Analyze speech patterns, rhythm, and pronunciation.',
      icon: MicIcon,
      component: SpeechPatternAssessment,
      route: '/assessment/speech-pattern'
    }
  ];

  // Function to check if an assessment is available
  const isAssessmentAvailable = (index) => {
    if (index === 0) return true; // First assessment is always available
    // Assessment is available if previous assessment is completed
    return completedAssessments.includes(assessmentTypes[index - 1].id);
  };

  // Function to check if assessment is completed
  const isAssessmentCompleted = (id) => {
    return completedAssessments.includes(id);
  };

  const startAssessment = (assessmentType, index) => {
    // Only allow starting assessment if it's available
    if (isAssessmentAvailable(index)) {
      setCurrentAssessment(assessmentType);
    }
  };

  const stopAssessment = async (metrics) => {
    const assessmentData = {
      type: currentAssessment,
      timestamp: new Date().toISOString(),
      metrics,
      userId: user.id
    };
    
    try {
      // Send assessment data to backend
      // await assessmentService.saveAssessment(assessmentData);
      console.log('Assessment completed:', assessmentData);
      
      // Mark current assessment as completed
      const updatedCompletedAssessments = [...completedAssessments];
      if (!updatedCompletedAssessments.includes(currentAssessment)) {
        updatedCompletedAssessments.push(currentAssessment);
      }
      
      // Save to localStorage
      localStorage.setItem(
        `completed_assessments_${user.id}`,
        JSON.stringify(updatedCompletedAssessments)
      );
      
      setCompletedAssessments(updatedCompletedAssessments);
      
      // Check if all assessments are completed
      if (checkAllAssessmentsCompleted(updatedCompletedAssessments, assessmentTypes)) {
        // All assessments completed - reset for next time and navigate to dashboard
        localStorage.setItem(`new_assessment_session_${user.id}`, 'true');
        navigate('/dashboard');
        return;
      }
      
      // Find the next assessment that isn't completed yet
      const currentIndex = assessmentTypes.findIndex(a => a.id === currentAssessment);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < assessmentTypes.length) {
        // Automatically navigate to the next assessment
        setCurrentAssessment(assessmentTypes[nextIndex].id);
      } else {
        // All assessments completed
        setCurrentAssessment(null);
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      setCurrentAssessment(null);
    }
  };

  const renderAssessment = () => {
    const assessment = assessmentTypes.find(a => a.id === currentAssessment);
    if (!assessment) return null;

    const AssessmentComponent = assessment.component;
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => setCurrentAssessment(null)}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1 }}>
            {assessment.title}
          </Typography>
        </Box>
        <AssessmentComponent 
          userId={user.id}
          onComplete={(data) => stopAssessment({
            ...data,
            assessmentType: assessment.id
          })}
        />
      </Box>
    );
  };

  const renderAssessmentList = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        Available Assessments
      </Typography>
      <Typography color="text.secondary" align="center" sx={{ mb: 3 }}>
        Complete assessments in sequence to unlock the next one
      </Typography>
      <Grid container spacing={2}>
        {assessmentTypes.map((assessment, index) => {
          const isAvailable = isAssessmentAvailable(index);
          const isCompleted = isAssessmentCompleted(assessment.id);
          
          return (
            <Grid item xs={12} key={assessment.id}>
              <Card 
                sx={{ 
                  cursor: isAvailable ? 'pointer' : 'default',
                  opacity: isAvailable ? 1 : 0.6,
                  transition: 'transform 0.2s ease-in-out, opacity 0.2s ease-in-out',
                  '&:hover': isAvailable ? {
                    transform: 'scale(1.02)',
                  } : {},
                  position: 'relative',
                }}
                onClick={() => isAvailable && startAssessment(assessment.id, index)}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                  {isCompleted ? (
                    <Badge 
                      color="success" 
                      badgeContent="✓" 
                      overlap="circular"
                    >
                      <assessment.icon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                    </Badge>
                  ) : (
                    <assessment.icon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                  )}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {assessment.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {assessment.description}
                    </Typography>
                  </Box>
                  {!isAvailable && (
                    <Tooltip title="Complete previous assessments to unlock">
                      <LockIcon sx={{ color: 'text.disabled' }} />
                    </Tooltip>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  return (
    <Layout>
      {currentAssessment ? renderAssessment() : renderAssessmentList()}
    </Layout>
  );
};

export default Assessment;
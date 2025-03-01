import { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, IconButton } from '@mui/material';
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
  const { user } = useAuth();

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

  const startAssessment = (assessmentType) => {
    setCurrentAssessment(assessmentType);
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
      setCurrentAssessment(null);
    } catch (error) {
      console.error('Error saving assessment:', error);
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
      <Grid container spacing={2}>
        {assessmentTypes.map((assessment) => (
          <Grid item xs={12} key={assessment.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.02)',
                  transition: 'transform 0.2s ease-in-out'
                }
              }}
              onClick={() => startAssessment(assessment.id)}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <assessment.icon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {assessment.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {assessment.description}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
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
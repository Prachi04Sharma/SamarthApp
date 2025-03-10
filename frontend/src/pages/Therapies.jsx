import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent,
  Button,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton
} from '@mui/material';
import { 
  LocalHospital, 
  RecordVoiceOver, 
  AccessibilityNew,
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Therapy from '../components/therapies/Therapy';
import { motion } from 'framer-motion';

// Styled Motion components
const MotionContainer = motion(Container);
const MotionPaper = motion(Paper);
const MotionCard = motion(Card);

const Therapies = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const therapyColors = {
    'parkinsonsTherapy': '#673ab7', // Deep Purple
    'bellsPalsyTherapy': '#ff5722', // Deep Orange
    'alsTherapy': '#2196f3', // Blue
  };

  const therapies = [
    {
      id: 'parkinsonsTherapy',
      title: "Parkinson's",
      description: 'Progressive nervous system disorder affecting movement and balance.',
      icon: AccessibilityNew,
      path: '/therapies/parkinsons',
      features: [
        'Tremor reduction exercises',
        'Balance improvement training',
        'Coordination enhancement'
      ]
    },
    {
      id: 'bellsPalsyTherapy',
      title: "Bell's Palsy",
      description: 'Sudden weakness in facial muscles causing one side of face to droop.',
      icon: RecordVoiceOver,
      path: '/therapies/bells-palsy',
      features: [
        'Facial muscle strengthening',
        'Symmetry restoration',
        'Speech articulation improvement'
      ]
    },
    {
      id: 'alsTherapy',
      title: 'ALS',
      description: 'Motor neuron disease affecting nerve cells in brain and spinal cord.',
      icon: LocalHospital,
      path: '/therapies/als',
      features: [
        'Respiratory function support',
        'Muscle preservation techniques',
        'Assistive device training'
      ]
    }
  ];

  return (
    <Layout>
      <MotionContainer 
        maxWidth="lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <MotionPaper 
          elevation={3}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          sx={{
            mb: 4,
            p: { xs: 3, md: 4 },
            mt: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #3a6186 0%, #89253e 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                mb: 1,
                background: 'linear-gradient(45deg, #FFFFFF 30%, #E0E0E0 90%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Specialized Therapy Programs
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
              Personalized approaches for neurological conditions
            </Typography>
            
            <Typography variant="body1" sx={{ maxWidth: '80%', mb: 3, opacity: 0.9 }}>
              Our therapy programs combine cutting-edge technology with evidence-based techniques 
              to deliver personalized care for various neurological conditions.
            </Typography>
          </Box>
          
          {/* Decorative elements */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '300px',
              height: '100%',
              background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 100%)',
              transform: 'skewX(-20deg)',
              transformOrigin: 'top right'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -20,
              left: -20,
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
        </MotionPaper>

        {/* Therapies Grid */}
        <Box sx={{ mb: 6 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3, 
              fontWeight: 600,
              px: isMobile ? 2 : 0 
            }}
          >
            Available Therapy Programs
          </Typography>
          
          <Grid container spacing={3}>
            {therapies.map((therapy, index) => (
              <Grid item xs={12} md={4} key={therapy.id}>
                <MotionCard 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                    },
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                  onClick={() => navigate(therapy.path)}
                >
                  {/* Color accent at top of card */}
                  <Box sx={{ 
                    height: 6, 
                    width: '100%', 
                    backgroundColor: therapyColors[therapy.id]
                  }} />
                  
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2 
                    }}>
                      <Box 
                        sx={{ 
                          p: 1.5, 
                          borderRadius: '50%', 
                          backgroundColor: `${therapyColors[therapy.id]}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <therapy.icon sx={{ 
                          fontSize: 28, 
                          color: therapyColors[therapy.id]
                        }} />
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          ml: 2, 
                          fontWeight: 600,
                          color: 'text.primary'
                        }}
                      >
                        {therapy.title}
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {therapy.description}
                    </Typography>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight={500} color="text.secondary">
                        Key features:
                      </Typography>
                      {therapy.features.map((feature, idx) => (
                        <Box 
                          key={idx} 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            mt: 1
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: therapyColors[therapy.id],
                              mr: 1.5
                            }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {feature}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    
                    <Box sx={{ mt: 'auto', pt: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <Button
                        variant="text"
                        size="small"
                        sx={{
                          color: therapyColors[therapy.id],
                          fontWeight: 500,
                        }}
                        endIcon={<InfoIcon />}
                      >
                        Learn More
                      </Button>
                      
                      <IconButton
                        size="small"
                        sx={{
                          color: 'white',
                          bgcolor: therapyColors[therapy.id],
                          '&:hover': {
                            bgcolor: `${therapyColors[therapy.id]}CC`,
                          }
                        }}
                      >
                        <ArrowForwardIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    {/* Subtle decorative elements */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -20,
                        right: -20,
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        bgcolor: `${therapyColors[therapy.id]}08`,
                        zIndex: 0
                      }}
                    />
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </Box>
        
        {/* Info Section */}
        <MotionPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          elevation={2}
          sx={{ 
            borderRadius: 3,
            p: { xs: 3, md: 4 },
            mb: 6,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            How Our Therapy Programs Work
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'rgba(33, 150, 243, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    mx: 'auto'
                  }}
                >
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#2196f3'
                    }}
                  >
                    1
                  </Typography>
                </Box>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Assessment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete a comprehensive assessment to establish your baseline and identify areas for improvement.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'rgba(103, 58, 183, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    mx: 'auto'
                  }}
                >
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#673ab7'
                    }}
                  >
                    2
                  </Typography>
                </Box>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Personalized Plan
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Receive a customized therapy program designed specifically for your condition and progression.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    mx: 'auto'
                  }}
                >
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#4caf50'
                    }}
                  >
                    3
                  </Typography>
                </Box>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Progress Tracking
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monitor your improvements over time with detailed analytics and regular progress reports.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </MotionPaper>
        
        {/* CTA Section */}
        <MotionPaper
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          elevation={0}
          sx={{ 
            borderRadius: 3,
            p: { xs: 3, md: 4 },
            mb: 4,
            background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
            color: 'white',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Ready to start your therapy journey?
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
              Begin with a comprehensive assessment to help us create your personalized therapy program.
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: '#4CAF50',
                fontWeight: 600,
                px: 4,
                py: 1,
                borderRadius: 8,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)'
                }
              }}
              onClick={() => navigate('/assessment')}
            >
              Start Assessment
            </Button>
          </Box>
          
          {/* Decorative elements */}
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.1)'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.08)'
            }}
          />
        </MotionPaper>
      </MotionContainer>
    </Layout>
  );
};

export default Therapies;
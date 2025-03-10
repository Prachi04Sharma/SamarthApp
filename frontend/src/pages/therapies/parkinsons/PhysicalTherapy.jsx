import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { FitnessCenter } from '@mui/icons-material';
import Layout from '../../../components/Layout';
import { TherapyDetailCard, BackNavigation } from '../../../components/therapies';
import handExerciseVideo from '../../../assets/parkinsons/hand1.mp4';
import balanceTrainingVideo from '../../../assets/parkinsons/facia2.mp4';
import strengthTrainingVideo from '../../../assets/parkinsons/finger1.mp4';

const ParkinsonsPhysicalTherapy = () => {
  const therapyDetails = [
    {
      title: "Hand Stretching",
      description: "Improve hand coordination and grip strength",
      icon: FitnessCenter,
      video: handExerciseVideo,
      techniques: [
        "Finger tapping",
        "Hand grip exercises",
        "Wrist rotations",
        "Fine motor drills"
      ]
    },
    {
      title: "Facial Muscle Exercise",
      description: "Enhance stability and prevent falls",
      icon: FitnessCenter,
      video: balanceTrainingVideo,
      techniques: [
        "Static balance exercises",
        "Dynamic balance training",
        "Postural control",
        "Walking practice"
      ]
    },
    {
      title: "Finger Tapping",
      description: "Build and maintain muscle strength",
      icon: FitnessCenter,
      video: strengthTrainingVideo,
      techniques: [
        "Resistance exercises",
        "Core strengthening",
        "Muscle endurance",
        "Joint mobility"
      ]
    }
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <BackNavigation to="/therapies/parkinsons" title="Back to Parkinson's Therapies" />
          <Typography variant="h4" gutterBottom>
            Parkinson's Physical Therapy
          </Typography>
          <Grid container spacing={3}>
            {therapyDetails.map((detail, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ 
                  height: '100%', 
                  boxShadow: 2,
                  '&:hover': { 
                    boxShadow: 4,
                    transform: 'translateY(-4px)'
                  },
                  transition: 'all 0.3s ease'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <FitnessCenter sx={{ fontSize: 30, mr: 2, color: 'primary.main' }} />
                      <Typography variant="h6">{detail.title}</Typography>
                    </Box>
                    {detail.video && (
                      <Box sx={{ mb: 2, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
                        <video 
                          controls 
                          width="100%"
                          style={{ borderRadius: '4px' }}
                        >
                          <source src={detail.video} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </Box>
                    )}
                    <Typography paragraph color="text.secondary">
                      {detail.description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Techniques:
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {detail.techniques.map((technique, i) => (
                          <Typography component="li" key={i} variant="body2" sx={{ mb: 0.5 }}>
                            {technique}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
};

export default ParkinsonsPhysicalTherapy;
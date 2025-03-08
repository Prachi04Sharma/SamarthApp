import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { FitnessCenter } from '@mui/icons-material';
import Layout from '../../../components/Layout';
import { TherapyDetailCard, BackNavigation } from '../../../components/therapies';
import yogaVideo from '../../../assets/als/yoga1.mp4';
import breathVideo from '../../../assets/als/breath2(ALS).mp4';
import balanceVideo from '../../../assets/als/balance.mp4';

const ALSPhysicalTherapy = () => {
  const therapyDetails = [
    {
      title: "Physical Therapy",
      description: "Specialized exercises for mobility and strength maintenance.",
      icon: FitnessCenter,
      video: yogaVideo,
      techniques: [
        "Range of motion exercises",
        "Strength training",
        "Balance exercises",
        "Flexibility exercises"
      ]
    },
    {
      title: "Breathing Exercises",
      description: "Exercises to improve respiratory function.",
      icon: FitnessCenter,
      video: breathVideo,
      techniques: [
        "Diaphragmatic breathing",
        "Pursed-lip breathing",
        "Deep breathing exercises",
        "Inspiratory muscle training"
      ]
    },
    {
      title: "Balance Training",
      description: "Exercises to improve balance and prevent falls.",
      icon: FitnessCenter,
      video: balanceVideo,
      techniques: [
        "Static balance exercises",
        "Dynamic balance training",
        "Postural control",
        "Walking practice"
      ]
    }
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <BackNavigation to="/therapies/als" title="Back to ALS Therapies" />
          <Typography variant="h4" gutterBottom>
            ALS Physical Therapy
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

export default ALSPhysicalTherapy;
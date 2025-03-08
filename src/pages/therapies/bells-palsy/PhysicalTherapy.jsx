import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { FitnessCenter } from '@mui/icons-material';
import Layout from '../../../components/Layout';
import { BackNavigation } from '../../../components/therapies';

const BellsPalsyPhysicalTherapy = () => {
  const therapyDetails = [
    {
      title: "Facial Exercises",
      description: "Exercises to strengthen facial muscles and improve symmetry.",
      icon: FitnessCenter,
      videoUrl: '/assets/bells/bell facial.mp4', // Add video URL here
      techniques: [
        "Gentle facial massage",
        "Mirror feedback exercises",
        "Facial muscle isolation",
        "Progressive resistance training"
      ],
      exercises: [
        "Eye closure and blinking",
        "Smile and frown exercises",
        "Cheek puffing",
        "Eyebrow raising"
      ]
    },
    {
      title: "Nerve Stimulation",
      description: "Techniques to promote nerve recovery and function.",
      icon: FitnessCenter,
      techniques: [
        "Electrical stimulation",
        "Heat therapy",
        "Cold therapy",
        "Facial tapping"
      ],
      exercises: [
        "Gentle nerve gliding",
        "Temperature contrast therapy",
        "Light touch exercises",
        "Facial pressure points"
      ]
    },
    {
      title: "Movement Control",
      description: "Exercises for precise facial movement control.",
      icon: FitnessCenter,
      techniques: [
        "Biofeedback training",
        "Symmetry exercises",
        "Coordination drills",
        "Muscle re-education"
      ],
      exercises: [
        "Small movement practice",
        "Controlled expressions",
        "Balance exercises",
        "Facial yoga poses"
      ]
    }
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <BackNavigation to="/therapies/bells-palsy" title="Back to Bell's Palsy Therapies" />
          <Typography variant="h4" gutterBottom>
            Bell's Palsy Physical Therapy
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
                    {detail.videoUrl && (
                      <Box sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                        <video
                          width="100%"
                          controls
                          style={{
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            display: 'block'
                          }}
                        >
                          <source src={detail.videoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <FitnessCenter sx={{ fontSize: 30, mr: 2, color: 'primary.main' }} />
                      <Typography variant="h6">{detail.title}</Typography>
                    </Box>
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

export default BellsPalsyPhysicalTherapy;
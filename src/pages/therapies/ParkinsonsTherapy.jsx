import React from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { FitnessCenter, RecordVoiceOver, Build } from '@mui/icons-material';
import TherapySection from '../../components/therapies/TherapySection';

const ParkinsonsTherapy = () => {
  const navigate = useNavigate();
  
  const therapyTypes = [
    {
      id: 'physical',
      title: "Physical Therapy",
      description: "Specialized exercises for mobility and balance",
      icon: FitnessCenter,
      path: '/therapies/parkinsons/physical',
      techniques: [
        "Balance training",
        "Gait improvement",
        "Muscle strengthening",
        "Movement strategies"
      ]
    },
    {
      id: 'speech',
      title: "Speech Therapy",
      description: "Voice and communication exercises",
      icon: RecordVoiceOver,
      path: '/therapies/parkinsons/speech',
      techniques: [
        "Voice strengthening",
        "Speech clarity",
        "Swallowing exercises",
        "Facial expressions"
      ]
    },
    {
      id: 'occupational',
      title: "Occupational Therapy",
      description: "Daily living skills enhancement",
      icon: Build,
      path: '/therapies/parkinsons/occupational',
      techniques: [
        "Daily task adaptation",
        "Home modifications",
        "Energy conservation",
        "Fine motor skills"
      ]
    }
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Parkinson's Therapy Options
          </Typography>
          <Grid container spacing={3}>
            {therapyTypes.map((therapy) => (
              <Grid item xs={12} md={4} key={therapy.id}>
                <Box 
                  onClick={() => navigate(therapy.path)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TherapySection {...therapy} />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
};

export default ParkinsonsTherapy;
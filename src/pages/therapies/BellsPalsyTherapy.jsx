import React from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { FitnessCenter, RecordVoiceOver, Build } from '@mui/icons-material';
import TherapySection from '../../components/therapies/TherapySection';

const BellsPalsyTherapy = () => {
  const navigate = useNavigate();

  const handleTherapyClick = (path) => {
    navigate(path);
  };

  const therapyTypes = [
    {
      id: 'physical',
      title: "Physical Therapy",
      description: "Facial muscle exercises and nerve stimulation",
      icon: FitnessCenter,
      path: '/therapies/bells-palsy/physical',
      videoUrl: '/assets/bells/bell facial.mp4',
      techniques: [
        "Facial exercises",
        "Massage techniques",
        "Nerve stimulation",
        "Muscle re-education"
      ]
    },
    {
      id: 'speech',
      title: "Speech Therapy",
      description: "Speech and facial movement exercises",
      icon: RecordVoiceOver,
      path: '/therapies/bells-palsy/speech',
      techniques: [
        "Articulation exercises",
        "Facial expression training",
        "Speech clarity work",
        "Lip movement exercises"
      ]
    },
    {
      id: 'occupational',
      title: "Occupational Therapy",
      description: "Adaptation strategies for daily activities",
      icon: Build,
      path: '/therapies/bells-palsy/occupational',
      techniques: [
        "Eye care strategies",
        "Eating techniques",
        "Facial hygiene",
        "Communication aids"
      ]
    }
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Bell's Palsy Therapy Options
          </Typography>
          <Grid container spacing={3}>
            {therapyTypes.map((therapy) => (
              <Grid item xs={12} md={4} key={therapy.id}>
                <TherapySection 
                  {...therapy} 
                  onClick={() => handleTherapyClick(therapy.path)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
};

export default BellsPalsyTherapy;
import React from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { FitnessCenter, RecordVoiceOver, Build } from '@mui/icons-material';
import TherapySection from '../../components/therapies/TherapySection';

const ALSTherapy = () => {
  const navigate = useNavigate();
  
  const therapyTypes = [
    {
      id: 'physical',
      title: "Physical Therapy",
      description: "Specialized exercises for mobility and strength maintenance",
      icon: FitnessCenter,
      path: '/therapies/als/physical'
    },
    {
      id: 'speech',
      title: "Speech Therapy",
      description: "Communication support and swallowing management",
      icon: RecordVoiceOver,
      path: '/therapies/als/speech'
    },
    {
      id: 'occupational',
      title: "Occupational Therapy",
      description: "Daily living adaptations and independence support",
      icon: Build,
      path: '/therapies/als/occupational'
    }
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            ALS Therapy Options
          </Typography>
          <Grid container spacing={3}>
            {therapyTypes.map((therapy) => (
              <Grid item xs={12} sm={6} md={4} key={therapy.id}>
                <Box 
                  onClick={() => navigate(therapy.path)}
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
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

export default ALSTherapy;
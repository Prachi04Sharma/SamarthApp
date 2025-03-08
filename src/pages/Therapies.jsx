import React from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { LocalHospital, RecordVoiceOver, AccessibilityNew } from '@mui/icons-material';
import Therapy from '../components/therapies/Therapy';

const Therapies = () => {
  const navigate = useNavigate();

  const therapies = [
    {
      id: 'parkinsonsTherapy',
      title: "Parkinson's",
      description: 'Progressive nervous system disorder affecting movement and balance.',
      icon: AccessibilityNew,
      path: '/therapies/parkinsons'
    },
    {
      id: 'bellsPalsyTherapy',
      title: "Bell's Palsy",
      description: 'Sudden weakness in facial muscles causing one side of face to droop.',
      icon: RecordVoiceOver,
      path: '/therapies/bells-palsy'
    },
    {
      id: 'alsTherapy',
      title: 'ALS',
      description: 'Motor neuron disease affecting nerve cells in brain and spinal cord.',
      icon: LocalHospital,
      path: '/therapies/als'
    }
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Available Therapies
          </Typography>
          <Grid container spacing={3}>
            {therapies.map((therapy) => (
              <Grid item xs={12} md={4} key={therapy.id}>
                <Box 
                  onClick={() => navigate(therapy.path)} 
                  sx={{ cursor: 'pointer' }}
                >
                  <Therapy
                    title={therapy.title}
                    description={therapy.description}
                    icon={therapy.icon}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
};

export default Therapies;
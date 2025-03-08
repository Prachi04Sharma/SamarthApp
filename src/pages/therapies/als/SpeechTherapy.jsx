import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { RecordVoiceOver } from '@mui/icons-material';
import Layout from '../../../components/Layout';

const ALSSpeechTherapy = () => {
  const exercises = [
    {
      title: "Communication Strategies",
      description: "Techniques to maintain speech clarity and communication",
      techniques: [
        "Voice amplification",
        "Speech pacing exercises",
        "Alternative communication devices",
        "Breath support techniques"
      ]
    },
    {
      title: "Swallowing Management",
      description: "Exercises to maintain safe swallowing function",
      techniques: [
        "Swallowing exercises",
        "Diet modification strategies",
        "Positioning for safe swallowing",
        "Oral motor exercises"
      ]
    },
    {
      title: "Respiratory Support",
      description: "Breathing exercises to support speech",
      techniques: [
        "Diaphragmatic breathing",
        "Coordination exercises",
        "Breath control techniques",
        "Voice conservation strategies"
      ]
    }
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>
            ALS Speech Therapy
          </Typography>
          <Grid container spacing={3}>
            {exercises.map((exercise, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <RecordVoiceOver sx={{ fontSize: 30, mr: 2, color: 'primary.main' }} />
                      <Typography variant="h6">{exercise.title}</Typography>
                    </Box>
                    <Typography paragraph color="text.secondary">
                      {exercise.description}
                    </Typography>
                    <Box component="ul" sx={{ pl: 2 }}>
                      {exercise.techniques.map((technique, i) => (
                        <Typography component="li" key={i} variant="body2">
                          {technique}
                        </Typography>
                      ))}
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

export default ALSSpeechTherapy;
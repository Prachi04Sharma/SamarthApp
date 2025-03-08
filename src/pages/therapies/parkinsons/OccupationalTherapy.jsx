import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { Build } from '@mui/icons-material';
import Layout from '../../../components/Layout';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../../components/therapies/BackButton';

const ParkinsonsOccupationalTherapy = () => {
  const therapyDetails = [
    {
      title: "Daily Living Activities",
      description: "Strategies for maintaining independence in daily tasks",
      techniques: [
        "Dressing techniques",
        "Eating strategies",
        "Writing adaptations",
        "Personal care methods"
      ],
      exercises: [
        "Button/zipper practice",
        "Utensil handling exercises",
        "Handwriting drills",
        "Grooming activities practice"
      ]
    },
    {
      title: "Home Safety",
      description: "Environmental modifications and safety strategies",
      techniques: [
        "Fall prevention",
        "Home assessment",
        "Equipment adaptation",
        "Transfer techniques"
      ],
      exercises: [
        "Safe transfer practice",
        "Environmental navigation",
        "Equipment use training",
        "Balance activities"
      ]
    },
    {
      title: "Energy Conservation",
      description: "Techniques to manage fatigue and maintain activity levels",
      techniques: [
        "Activity pacing",
        "Task simplification",
        "Work modification",
        "Rest scheduling"
      ],
      exercises: [
        "Activity scheduling",
        "Energy-saving techniques",
        "Task prioritization",
        "Rest break timing"
      ]
    }
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <BackButton to="/therapies/parkinsons" title="Back to Parkinson's Therapies" />
          <Typography variant="h4" gutterBottom>
            Parkinson's Occupational Therapy
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
                      <Build sx={{ fontSize: 30, mr: 2, color: 'primary.main' }} />
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
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Exercises:
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {detail.exercises.map((exercise, i) => (
                          <Typography component="li" key={i} variant="body2" sx={{ mb: 0.5 }}>
                            {exercise}
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

export default ParkinsonsOccupationalTherapy;
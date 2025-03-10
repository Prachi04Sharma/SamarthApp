import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { Build } from '@mui/icons-material';
import Layout from '../../../components/Layout';
import { BackNavigation } from '../../../components/therapies';

const BellsPalsyOccupationalTherapy = () => {
  const therapyDetails = [
    {
      title: "Daily Activities",
      description: "Strategies for managing daily tasks.",
      icon: Build,
      techniques: [
        "Eating adaptations",
        "Drinking strategies",
        "Eye care routines",
        "Facial hygiene"
      ],
      exercises: [
        "Utensil handling",
        "Cup drinking practice",
        "Eye protection drills",
        "Face washing techniques"
      ]
    },
    {
      title: "Environmental Adaptation",
      description: "Modifications for home and work environments.",
      icon: Build,
      techniques: [
        "Lighting adjustments",
        "Mirror placement",
        "Workspace setup",
        "Safety modifications"
      ],
      exercises: [
        "Activity modifications",
        "Environmental navigation",
        "Task simplification",
        "Safety awareness"
      ]
    },
    {
      title: "Social Integration",
      description: "Strategies for social situations.",
      icon: Build,
      techniques: [
        "Communication aids",
        "Social strategies",
        "Confidence building",
        "Coping techniques"
      ],
      exercises: [
        "Social interaction practice",
        "Communication exercises",
        "Self-advocacy training",
        "Stress management"
      ]
    }
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <BackNavigation to="/therapies/bells-palsy" title="Back to Bell's Palsy Therapies" />
          <Typography variant="h4" gutterBottom>
            Bell's Palsy Occupational Therapy
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

export default BellsPalsyOccupationalTherapy;
import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { Build } from '@mui/icons-material';
import Layout from '../../../components/Layout';

const ALSOccupationalTherapy = () => {
  const activities = [
    {
      title: "Daily Living Adaptations",
      description: "Strategies for maintaining independence in daily activities",
      techniques: [
        "Adaptive equipment use",
        "Modified eating techniques",
        "Dressing strategies",
        "Personal care adaptations"
      ]
    },
    {
      title: "Home Modifications",
      description: "Environmental adjustments for safety and accessibility",
      techniques: [
        "Furniture arrangement",
        "Bathroom modifications",
        "Mobility equipment setup",
        "Safety feature installation"
      ]
    },
    {
      title: "Energy Conservation",
      description: "Techniques to manage fatigue and maintain activity levels",
      techniques: [
        "Activity pacing",
        "Task simplification",
        "Energy-saving techniques",
        "Work station setup"
      ]
    }
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>
            ALS Occupational Therapy
          </Typography>
          <Grid container spacing={3}>
            {activities.map((activity, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Build sx={{ fontSize: 30, mr: 2, color: 'primary.main' }} />
                      <Typography variant="h6">{activity.title}</Typography>
                    </Box>
                    <Typography paragraph color="text.secondary">
                      {activity.description}
                    </Typography>
                    <Box component="ul" sx={{ pl: 2 }}>
                      {activity.techniques.map((technique, i) => (
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

export default ALSOccupationalTherapy;
import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { RecordVoiceOver } from '@mui/icons-material';
import Layout from '../../../components/Layout';
import { TherapyDetailCard, BackNavigation } from '../../../components/therapies';

const BellsPalsySpeechTherapy = () => {
  const therapyDetails = [
    {
      title: "Speech Articulation",
      description: "Exercises to improve speech clarity and pronunciation",
      icon: RecordVoiceOver,
      techniques: [
        "Lip strengthening",
        "Tongue control",
        "Articulation drills",
        "Pronunciation practice"
      ],
      exercises: [
        "Speech sound practice",
        "Word repetition drills",
        "Tongue twisters",
        "Mirror practice"
      ]
    },
    {
      title: "Oral Motor Skills",
      description: "Exercises for better mouth control and movement",
      icon: RecordVoiceOver,
      techniques: [
        "Lip exercises",
        "Cheek exercises",
        "Jaw control",
        "Swallowing techniques"
      ],
      exercises: [
        "Lip stretches",
        "Cheek puffing",
        "Drinking exercises",
        "Facial expressions"
      ]
    },
    {
      title: "Communication Strategies",
      description: "Techniques for effective communication",
      icon: RecordVoiceOver,
      techniques: [
        "Non-verbal cues",
        "Voice projection",
        "Pace control",
        "Expression practice"
      ],
      exercises: [
        "Reading aloud",
        "Conversation practice",
        "Voice modulation",
        "Expression drills"
      ]
    }
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <BackNavigation to="/therapies/bells-palsy" title="Back to Bell's Palsy Therapies" />
          <Typography variant="h4" gutterBottom>
            Bell's Palsy Speech Therapy
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
                      <RecordVoiceOver sx={{ fontSize: 30, mr: 2, color: 'primary.main' }} />
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

export default BellsPalsySpeechTherapy;
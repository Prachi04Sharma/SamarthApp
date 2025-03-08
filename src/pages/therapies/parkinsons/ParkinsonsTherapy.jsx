import { useNavigate } from 'react-router-dom';

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
    // ...existing therapy types
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
              <Grid item xs={12} sm={6} md={4} key={therapy.id}>
                <Box 
                  onClick={() => navigate(therapy.path)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TherapyDetailCard {...therapy} />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
};
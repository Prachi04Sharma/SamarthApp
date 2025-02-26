import { Container, Box, Paper, Typography, Avatar, Grid, Button } from '@mui/material';
import { Edit, PhotoCamera } from '@mui/icons-material';
import Layout from '../components/Layout';

const Profile = () => {
  // This would typically come from your authentication context
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: null, // URL to user's avatar
    joinDate: new Date('2024-01-01').toLocaleDateString(),
  };

  return (
    <Layout>
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '3rem',
                }}
                src={user.avatar}
              >
                {user.name.charAt(0)}
              </Avatar>
              <Button
                startIcon={<PhotoCamera />}
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
              >
                Change Photo
              </Button>
              <Typography variant="h5" gutterBottom>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Member since {user.joinDate}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">Personal Information</Typography>
                    <Button startIcon={<Edit />} size="small">
                      Edit
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography>{user.email}</Typography>
                    </Grid>
                    {/* Add more profile fields as needed */}
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Activity Summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No activities to show yet.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Container>
    </Layout>
  );
};

export default Profile; 
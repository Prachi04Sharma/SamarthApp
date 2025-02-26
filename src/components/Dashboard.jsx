import { 
  Box, 
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button
} from '@mui/material';
import { 
  Assessment, 
  Timeline, 
  Person, 
  Settings
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const StatCard = ({ title, value, icon: Icon }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Icon sx={{ color: 'primary.main', mr: 1 }} />
          <Typography color="textSecondary" variant="h6">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4">{value}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome back, {currentUser?.email?.split('@')[0]}!
          </Typography>
          <Typography color="textSecondary">
            Here's your health assessment overview
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Assessments"
              value="5"
              icon={Assessment}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Progress"
              value="75%"
              icon={Timeline}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Profile"
              value="Complete"
              icon={Person}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Settings"
              value="Updated"
              icon={Settings}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Button 
                variant="contained" 
                fullWidth 
                startIcon={<Assessment />}
                onClick={() => navigate('/assessment')}
              >
                Start New Assessment
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button 
                variant="outlined" 
                fullWidth 
                startIcon={<Timeline />}
                onClick={() => navigate('/analytics')}
              >
                View Analytics
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button 
                variant="outlined" 
                fullWidth 
                startIcon={<Person />}
                onClick={() => navigate('/profile')}
              >
                Update Profile
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
};

export default Dashboard; 
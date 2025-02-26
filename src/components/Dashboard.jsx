import { 
  Box, 
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  useTheme,
  Paper
} from '@mui/material';
import { 
  Assessment, 
  Timeline, 
  Person, 
  Settings,
  Analytics,
  TrendingUp,
  Speed,
  Assignment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const FeatureCard = ({ title, value, subtitle, icon: Icon, onClick, gradient }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        background: gradient || 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
        color: 'white',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Icon sx={{ fontSize: 40, opacity: 0.9 }} />
          <Typography variant="h6" sx={{ ml: 2, fontWeight: 'bold' }}>
            {title}
          </Typography>
        </Box>
        {value && (
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
            {value}
          </Typography>
        )}
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <Container maxWidth="xl">
        {/* Welcome Section */}
        <Paper 
          elevation={0}
          sx={{
            mb: 4,
            p: 4,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Welcome back, {user?.name || user?.email?.split('@')[0] || 'User'}! 👋
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Your health journey dashboard
            </Typography>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '300px',
              height: '100%',
              background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 100%)',
              transform: 'skewX(-20deg)',
              transformOrigin: 'top right'
            }}
          />
        </Paper>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6} lg={3}>
            <FeatureCard
              title="Assessments"
              value="5"
              subtitle="Total evaluations"
              icon={Assessment}
              onClick={() => navigate('/assessment')}
              gradient="linear-gradient(135deg, #FF9F43 0%, #FF7F50 100%)"
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <FeatureCard
              title="Progress"
              value="75%"
              subtitle="Monthly improvement"
              icon={TrendingUp}
              onClick={() => navigate('/analytics')}
              gradient="linear-gradient(135deg, #4CAF50 0%, #45B649 100%)"
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <FeatureCard
              title="Health Score"
              value="8.5"
              subtitle="Current rating"
              icon={Speed}
              onClick={() => navigate('/health-score')}
              gradient="linear-gradient(135deg, #6B8DD6 0%, #4E73DF 100%)"
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <FeatureCard
              title="Tasks"
              value="3"
              subtitle="Pending actions"
              icon={Assignment}
              onClick={() => navigate('/tasks')}
              gradient="linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)"
            />
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Button 
                variant="contained" 
                fullWidth 
                size="large"
                startIcon={<Assessment />}
                onClick={() => navigate('/assessment')}
                sx={{
                  py: 3,
                  background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E8E 90%)',
                  boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FF5252 30%, #FF7676 90%)',
                  }
                }}
              >
                Start New Assessment
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button 
                variant="contained"
                fullWidth 
                size="large"
                startIcon={<Analytics />}
                onClick={() => navigate('/analytics')}
                sx={{
                  py: 3,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1E88E5 30%, #1CB5E0 90%)',
                  }
                }}
              >
                View Analytics
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button 
                variant="contained"
                fullWidth 
                size="large"
                startIcon={<Person />}
                onClick={() => navigate('/profile')}
                sx={{
                  py: 3,
                  background: 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)',
                  boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #43A047 30%, #66BB6A 90%)',
                  }
                }}
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
import { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import Layout from '../components/Layout';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [assessments, setAssessments] = useState([]);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        // Here you would typically fetch from your backend
        // For now, using mock data
        const mockData = [
          {
            id: '1',
            type: 'eyeMovement',
            timestamp: new Date().toISOString(),
            metrics: {
              accuracy: '85%',
              completionTime: '45s'
            }
          },
          {
            id: '2',
            type: 'neckMobility',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            metrics: {
              range: '90°',
              stability: 'Good'
            }
          }
        ];
        setAssessments(mockData);
      } catch (error) {
        console.error('Error fetching assessments: ', error);
      }
    };

    fetchAssessments();
  }, []);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Assessment Score',
        data: [75, 82, 78, 85, 80, 88],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Progress Over Time'
      }
    }
  };

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom align="center">
          Assessment Analytics
        </Typography>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Progress Chart
            </Typography>
            <Line data={chartData} options={chartOptions} />
          </CardContent>
        </Card>

        <Typography variant="h6" gutterBottom>
          Recent Assessments
        </Typography>

        <Grid container spacing={2}>
          {assessments.map((assessment) => (
            <Grid item xs={12} key={assessment.id}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Date: {new Date(assessment.timestamp).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time: {new Date(assessment.timestamp).toLocaleTimeString()}
                  </Typography>
                  {assessment.metrics && (
                    <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Metrics
                      </Typography>
                      {Object.entries(assessment.metrics).map(([key, value]) => (
                        <Typography key={key} variant="body2">
                          {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Layout>
  );
};

export default Analytics; 
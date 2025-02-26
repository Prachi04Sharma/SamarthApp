import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  DirectionsWalk as WalkIcon,
  Speed as SpeedIcon,
  Balance as BalanceIcon,
  Timeline as PatternIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import AssessmentLayout from './AssessmentLayout';
import { startGaitAnalysis, stopGaitAnalysis } from '../../services/assessments/gaitService';
import assessmentService from '../../services/assessmentService';
import {
  GaitPhaseChart,
  StabilityHeatmap,
  SymmetryRadar,
  JointAnglesTimeline
} from '../visualizations/GaitVisualizations';
import { GaitMetricsAnalyzer } from '../../services/metrics/gaitMetrics';
import { useAuth } from '../../contexts/AuthContext';
import { assessment } from '../../services/api';

// MetricCard component
const MetricCard = ({ title, value, icon, description }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" gutterBottom>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const GaitAnalysis = ({ userId, onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realtimeData, setRealtimeData] = useState({
    acceleration: [],
    balance: [],
    timestamps: [],
    phaseData: [],
    stabilityData: {
      stabilityTrends: {
        timeSeriesData: []
      }
    },
    jointData: {
      timestamps: [],
      hipAngles: [],
      kneeAngles: [],
      ankleAngles: []
    },
    symmetryData: []
  });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timeoutRef = useRef(null);
  const analysisRef = useRef(null);
  const streamRef = useRef(null);
  const [baselineData, setBaselineData] = useState(null);
  const metricsAnalyzer = useRef(new GaitMetricsAnalyzer());
  const { currentUser } = useAuth();

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (analysisRef.current && streamRef.current) {
      stopGaitAnalysis();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    // Load baseline data when component mounts
    loadBaselineData();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      stopGaitAnalysis();
    };
  }, []);

  const loadBaselineData = async () => {
    try {
      const response = await assessmentService.getBaselineData('GAIT_ANALYSIS');
      setBaselineData(response?.data);
      metricsAnalyzer.current.baselineData = response?.data;
    } catch (error) {
      console.error('Error loading baseline data:', error);
      // Don't set error state as baseline data is optional
    }
  };

  const startAssessment = async () => {
    try {
      cleanup();
      setLoading(true);
      setIsRecording(true);
      setError(null);
      setMetrics(null);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640,
          height: 480,
          frameRate: { ideal: 30 }
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.width = 640;
        videoRef.current.height = 480;
      }

      if (canvasRef.current) {
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
      }

      // Wait for video to be ready
      await new Promise((resolve) => {
        videoRef.current.onloadeddata = () => {
          videoRef.current.play();
          resolve();
        };
      });

      // Start gait analysis
      await startGaitAnalysis(videoRef.current, handleRealtimeUpdate);

      // Auto-stop after 30 seconds
      timeoutRef.current = setTimeout(() => {
        stopAssessment();
      }, 30000);

    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const stopAssessment = async () => {
    try {
      setIsRecording(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Stop video stream and analysis
      const stream = videoRef.current?.srcObject;
      stream?.getTracks().forEach(track => track.stop());
      stopGaitAnalysis();

      // Save assessment results if metrics exist
      if (metrics) {
        await saveAssessmentResults();
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleRealtimeUpdate = (data) => {
    if (data.error) {
      handleError(new Error(data.error));
      return;
    }

    // Draw pose on canvas
    if (canvasRef.current && data.keypoints) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      drawPose(ctx, data.keypoints);
    }

    // Update realtime data for visualizations
    setRealtimeData(prevData => {
      // Keep only the last 100 data points for performance
      const maxDataPoints = 100;
      const sliceStart = prevData.timestamps.length > maxDataPoints ? 1 : 0;
      const timestamp = Date.now();

      // Add new phase data point
      const newPhaseData = [...(prevData.phaseData || []).slice(sliceStart)];
      if (data.phaseData) {
        newPhaseData.push(data.phaseData);
      }

      return {
        acceleration: [...prevData.acceleration.slice(sliceStart), data.velocity || { x: 0, y: 0 }],
        balance: [...prevData.balance.slice(sliceStart), data.balance || 0],
        timestamps: [...prevData.timestamps.slice(sliceStart), timestamp],
        phaseData: newPhaseData,
        stabilityData: {
          stabilityTrends: {
            timeSeriesData: [
              ...prevData.stabilityData.stabilityTrends.timeSeriesData.slice(sliceStart),
              {
                timestamp,
                stability: data.stability?.score || 0,
                lateralSway: data.stability?.lateralSway || 0,
                verticalSway: data.stability?.verticalSway || 0
              }
            ]
          }
        },
        jointData: {
          timestamps: [...prevData.jointData.timestamps.slice(sliceStart), timestamp],
          hipAngles: [...prevData.jointData.hipAngles.slice(sliceStart), 
            (data.jointAngles?.find(j => j.joint === 'left_hip')?.angle || 0)],
          kneeAngles: [...prevData.jointData.kneeAngles.slice(sliceStart),
            (data.jointAngles?.find(j => j.joint === 'left_knee')?.angle || 0)],
          ankleAngles: [...prevData.jointData.ankleAngles.slice(sliceStart),
            (data.jointAngles?.find(j => j.joint === 'left_ankle')?.angle || 0)]
        },
        symmetryData: [
          data.symmetry?.legSymmetry || 0,
          data.symmetry?.overall || 0,
          data.symmetry?.armSymmetry || 0,
          data.jointAngles?.find(j => j.joint === 'left_hip')?.confidence || 0,
          data.jointAngles?.find(j => j.joint === 'right_hip')?.confidence || 0,
          data.jointAngles?.find(j => j.joint === 'left_knee')?.confidence || 0
        ]
      };
    });

    // Update metrics for display
    if (data.stability || data.balance || data.symmetry || data.jointAngles) {
      setMetrics({
        stability: data.stability?.score || 0,
        balance: data.balance || 0,
        symmetry: data.symmetry?.overall || 0,
        jointAngles: data.jointAngles || []
      });
    }
  };

  const drawPose = (ctx, keypoints) => {
    // Draw keypoints
    keypoints.forEach(keypoint => {
      if (keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      }
    });

    // Draw connections
    const connections = [
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'],
      ['right_shoulder', 'right_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'],
      ['right_hip', 'right_knee'],
      ['left_knee', 'left_ankle'],
      ['right_knee', 'right_ankle']
    ];

    connections.forEach(([p1, p2]) => {
      const point1 = keypoints.find(kp => kp.name === p1);
      const point2 = keypoints.find(kp => kp.name === p2);
      
      if (point1 && point2 && point1.score > 0.3 && point2.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  const saveAssessmentResults = async () => {
    try {
      const assessmentData = {
        user: userId,
        type: 'GAIT_ANALYSIS',
        data: {
          timestamps: realtimeData.timestamps,
          acceleration: realtimeData.acceleration,
          balance: realtimeData.balance,
          phaseData: realtimeData.phaseData,
          stabilityData: realtimeData.stabilityData,
          jointData: realtimeData.jointData,
          symmetryData: realtimeData.symmetryData
        },
        metrics: {
          stability: metrics.stability || 0,
          balance: metrics.balance || 0,
          symmetry: metrics.symmetry || 0,
          jointAngles: metrics.jointAngles || [],
          overallScore: calculateOverallScore(metrics)
        },
        status: 'COMPLETED'
      };

      await assessmentService.saveAssessment(userId, 'GAIT_ANALYSIS', assessmentData);
    } catch (err) {
      console.error('Failed to save assessment results:', err);
    }
  };

  const calculateOverallScore = (metrics) => {
    if (!metrics) return 0;
    const scores = [
      metrics.stability || 0,
      metrics.balance || 0,
      metrics.symmetry || 0
    ];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const handleError = (error) => {
    setError(error.message);
    setIsRecording(false);
  };

  const renderMetrics = () => {
    if (!metrics) return null;

    const hipAngle = metrics.jointAngles.find(j => j.joint === 'left_hip')?.angle || 0;
    const kneeAngle = metrics.jointAngles.find(j => j.joint === 'left_knee')?.angle || 0;

    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Stability"
            value={`${metrics.stability.toFixed(1)}%`}
            icon={<SpeedIcon color="primary" />}
            description="Overall postural stability and balance control"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Balance"
            value={`${metrics.balance.toFixed(1)}%`}
            icon={<BalanceIcon color="primary" />}
            description="Left-right weight distribution and vertical alignment"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Symmetry"
            value={`${metrics.symmetry.toFixed(1)}%`}
            icon={<PatternIcon color="primary" />}
            description="Bilateral movement symmetry and coordination"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Hip/Knee Angles"
            value={`${hipAngle.toFixed(1)}° / ${kneeAngle.toFixed(1)}°`}
            icon={<WalkIcon color="primary" />}
            description="Primary joint angles during gait cycle"
          />
        </Grid>
      </Grid>
    );
  };

  const renderEnhancedVisualizations = () => {
    if (!realtimeData.timestamps.length) return null;

    return (
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Gait Phase Analysis
              </Typography>
              <GaitPhaseChart 
                data={realtimeData.phaseData}
                baselineData={baselineData?.phaseData}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Stability Heatmap
              </Typography>
              <StabilityHeatmap data={realtimeData.stabilityData} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Symmetry Analysis
              </Typography>
              <SymmetryRadar 
                currentData={realtimeData.symmetryData}
                baselineData={baselineData?.symmetryData}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Joint Angles
              </Typography>
              <JointAnglesTimeline data={realtimeData.jointData} />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <AssessmentLayout
      title="Gait Analysis"
      description={
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              This assessment will analyze your walking pattern. Please ensure you have enough space
              to walk naturally for about 30 seconds.
            </Typography>
          </Box>
          <Alert severity="info">
            Position yourself about 2-3 meters from the camera and walk naturally
            back and forth within the camera's view.
          </Alert>
        </Box>
      }
    >
      <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, position: 'relative' }}>
              <video
                ref={videoRef}
                style={{ width: '100%', display: isRecording ? 'block' : 'none' }}
                autoPlay
                playsInline
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              />
              {loading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color={isRecording ? 'error' : 'primary'}
                onClick={isRecording ? stopAssessment : startAssessment}
                disabled={loading}
                startIcon={<WalkIcon />}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>

        {renderEnhancedVisualizations()}
        {renderMetrics()}
      </Box>
    </AssessmentLayout>
  );
};

export default GaitAnalysis; 
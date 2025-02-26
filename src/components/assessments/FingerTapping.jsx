import React, { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import {
  TouchApp as TapIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  Sync as RhythmIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import AssessmentLayout from './AssessmentLayout';
import { mlService, assessmentService } from '../../services';
import {
  TapPatternChart,
  RhythmAnalysisChart,
  FatigueProgressionChart,
  PrecisionMap
} from '../visualizations/FingerTapVisualizations';
import { FingerTapMetricsAnalyzer } from '../../services/metrics/fingerTapMetrics';

const MetricCard = ({ title, value, icon, description }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" component="div" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ mb: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const FingerTapping = ({ userId, onComplete }) => {
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [realtimeData, setRealtimeData] = useState({
    tapIntervals: [],
    tapForce: [],
    timestamps: [],
    tapData: [],
    rhythmData: [],
    fatigueData: [],
    precisionData: []
  });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [baselineData, setBaselineData] = useState(null);
  const metricsAnalyzer = useRef(new FingerTapMetricsAnalyzer());
  const analysisRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (analysisRef.current?.stop) {
        analysisRef.current.stop();
      }
    };
  }, []);

  const startAssessment = async () => {
    try {
      setIsAssessing(true);
      setError(null);
      setSuccessMessage(null);
      setMetrics(null);
      setRealtimeData({
        tapIntervals: [],
        tapForce: [],
        timestamps: [],
        tapData: [],
        rhythmData: [],
        fatigueData: [],
        precisionData: []
      });

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640,
          height: 480,
          frameRate: { ideal: 30 }
        } 
      });
      
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

      // Start finger movement tracking
      analysisRef.current = await mlService.startFingerTapping(
        videoRef.current,
        canvasRef.current,
        handleRealtimeUpdate
      );

      // Auto-stop after 20 seconds
      setTimeout(() => {
        if (isAssessing) {
          stopAssessment(stream);
        }
      }, 20000);

    } catch (err) {
      handleError(err);
    }
  };

  const stopAssessment = async (stream) => {
    try {
      if (analysisRef.current?.stop) {
        analysisRef.current.stop();
      }
      stream.getTracks().forEach(track => track.stop());

      // Calculate final metrics
      const finalMetrics = {
        tapsPerSecond: calculateTapsPerSecond(),
        rhythmScore: calculateRhythmScore(),
        duration: (Date.now() - realtimeData.timestamps[0]) / 1000,
        accuracy: calculateAccuracy()
      };

      setMetrics(finalMetrics);
      await saveAssessmentResults(finalMetrics);
      
      // Instead of immediately calling onComplete, show a success message
      setError(null); // Clear any existing errors
      
      // Optional: Notify parent component about completion without navigation
      if (onComplete) {
        // Pass false to indicate we don't want to navigate away
        onComplete({ ...finalMetrics, shouldNavigate: false });
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsAssessing(false);
    }
  };

  const calculateTapsPerSecond = () => {
    const tapCount = realtimeData.tapForce.filter(force => force === 1).length;
    const duration = (realtimeData.timestamps[realtimeData.timestamps.length - 1] - realtimeData.timestamps[0]) / 1000;
    return tapCount / duration;
  };

  const calculateRhythmScore = () => {
    const tapIntervals = realtimeData.tapIntervals;
    if (tapIntervals.length < 2) return 100;

    const intervalVariances = tapIntervals.slice(1).map((interval, i) => 
      Math.abs(interval - tapIntervals[i])
    );
    const averageVariance = intervalVariances.reduce((a, b) => a + b, 0) / intervalVariances.length;
    return Math.max(0, 100 - (averageVariance * 0.5));
  };

  const calculateAccuracy = () => {
    const tapForces = realtimeData.tapForce;
    if (tapForces.length === 0) return 0;
    const successfulTaps = tapForces.filter(force => force === 1).length;
    return Math.max(10, (successfulTaps / tapForces.length) * 100);
  };

  const handleRealtimeUpdate = (data) => {
    // Add debug logging
    console.debug('Tap data:', {
        force: data.force,
        interval: data.interval,
        timestamp: data.timestamp
    });
    
    setRealtimeData(prevData => {
      // Keep only last 100 data points for performance
      const maxDataPoints = 100;
      const sliceStart = prevData.timestamps.length > maxDataPoints ? 1 : 0;

      // Add tap force threshold
      const isTap = data.force > 0.5; // Adjust threshold as needed
      const tapForce = isTap ? 1 : 0;

      // Calculate tap data for visualization
      const tapData = {
        time: data.timestamp - (prevData.timestamps[0] || data.timestamp),
        amplitude: data.interval,
        speed: data.force ? 1 : 0
      };

      // Calculate rhythm data
      const rhythmData = {
        timestamps: [...prevData.rhythmData.timestamps || [], data.timestamp],
        intervals: [...prevData.rhythmData.intervals || [], data.interval],
        targetInterval: 200 // Target interval in milliseconds (adjust as needed)
      };

      // Calculate fatigue data
      const fatigueData = {
        timestamps: [...prevData.fatigueData.timestamps || [], data.timestamp],
        speedMetrics: [...prevData.fatigueData.speedMetrics || [], data.force ? 100 : 0],
        accuracyMetrics: [...prevData.fatigueData.accuracyMetrics || [], calculateAccuracy()],
        consistencyMetrics: [...prevData.fatigueData.consistencyMetrics || [], calculateRhythmScore()]
      };

      // Calculate precision data
      const precisionData = data.landmarks ? [
        ...prevData.precisionData || [],
        {
          frequency: calculateTapsPerSecond(),
          deviation: Math.abs(data.interval - (rhythmData.targetInterval || 200))
        }
      ] : prevData.precisionData;

      return {
        tapIntervals: [...prevData.tapIntervals.slice(sliceStart), data.interval],
        tapForce: [...prevData.tapForce.slice(sliceStart), tapForce],
        timestamps: [...prevData.timestamps.slice(sliceStart), data.timestamp],
        tapData: [...prevData.tapData.slice(sliceStart), tapData],
        rhythmData,
        fatigueData,
        precisionData: precisionData?.slice(sliceStart)
      };
    });
  };

  const saveAssessmentResults = async (results) => {
    try {
      // Validate results
      if (results.tapsPerSecond === 0 && results.accuracy === 0) {
        throw new Error('No valid taps detected. Please try again.');
      }

      const assessmentData = {
        user: userId,
        type: 'FINGER_TAPPING',
        data: {
          tapIntervals: realtimeData.tapIntervals,
          tapForce: realtimeData.tapForce,
          timestamps: realtimeData.timestamps,
          tapData: realtimeData.tapData,
          rhythmData: realtimeData.rhythmData,
          fatigueData: realtimeData.fatigueData,
          precisionData: realtimeData.precisionData
        },
        metrics: {
          frequency: Math.max(0.1, results.tapsPerSecond),
          amplitude: calculateAverageAmplitude(),
          rhythm: results.rhythmScore,
          overallScore: Math.max(10, (results.accuracy + results.rhythmScore) / 2),
          accuracy: Math.max(10, results.accuracy),
          duration: results.duration
        },
        status: 'COMPLETED'
      };

      console.log('Sending assessment data:', assessmentData);
      await assessmentService.saveAssessment(userId, 'FINGER_TAPPING', assessmentData);
      
      // Set success message
      setSuccessMessage('Assessment completed successfully! You can review your results below.');
    } catch (err) {
      console.error('Failed to save assessment results:', err);
      setError(err.message);
    }
  };

  const calculateAverageAmplitude = () => {
    if (!realtimeData.tapData.length) return 0;
    const amplitudes = realtimeData.tapData.map(d => d.amplitude);
    return amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
  };

  const handleError = (error) => {
    setError(error.message);
    setIsAssessing(false);
  };

  useEffect(() => {
    // Load baseline data
    const loadBaseline = async () => {
      try {
        const baseline = await assessmentService.getBaselineData('FINGER_TAPPING');
        setBaselineData(baseline);
        metricsAnalyzer.current.baselineData = baseline;
      } catch (err) {
        console.error('Failed to load baseline data:', err);
      }
    };

    loadBaseline();
  }, []);

  const renderMetrics = () => {
    if (!metrics) return null;

    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Tapping Speed"
            value={`${metrics.tapsPerSecond.toFixed(1)} taps/s`}
            icon={<SpeedIcon color="primary" />}
            description="Average tapping frequency"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Rhythm Score"
            value={`${metrics.rhythmScore.toFixed(1)}%`}
            icon={<RhythmIcon color="primary" />}
            description="Tapping rhythm consistency"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Duration"
            value={`${metrics.duration.toFixed(1)}s`}
            icon={<TimerIcon color="primary" />}
            description="Assessment duration"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Accuracy"
            value={`${metrics.accuracy.toFixed(1)}%`}
            icon={<TapIcon color="primary" />}
            description="Movement precision"
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
                Tapping Pattern
              </Typography>
              <TapPatternChart 
                data={realtimeData.tapData}
                baselineData={baselineData?.tapData}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Rhythm Analysis
              </Typography>
              <RhythmAnalysisChart data={realtimeData.rhythmData} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Fatigue Progression
              </Typography>
              <FatigueProgressionChart data={realtimeData.fatigueData} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Precision Map
              </Typography>
              <PrecisionMap data={realtimeData.precisionData} />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <AssessmentLayout
      title="Finger Tapping Test"
      description={
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body1">
            This assessment will analyze your finger tapping pattern. Please tap your index finger
            and thumb together repeatedly at a comfortable pace.
          </Typography>
          <Alert severity="info">
            Position your hand clearly in view of the camera, with your palm facing the camera.
            Tap your index finger and thumb together repeatedly for 20 seconds.
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
                style={{ width: '100%', display: isAssessing ? 'block' : 'none' }}
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
              {!isAssessing && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <TapIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6">
                    Click Start to begin the finger tapping test
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              {!isAssessing && metrics ? (
                <>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={startAssessment}
                    startIcon={<TapIcon />}
                  >
                    Start New Assessment
                  </Button>
                  {successMessage && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      {successMessage}
                    </Alert>
                  )}
                </>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  color={isAssessing ? 'error' : 'primary'}
                  onClick={isAssessing ? () => stopAssessment(videoRef.current?.srcObject) : startAssessment}
                  disabled={error !== null}
                  startIcon={<TapIcon />}
                >
                  {isAssessing ? 'Stop Recording' : 'Start Assessment'}
                </Button>
              )}
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

export default FingerTapping; 
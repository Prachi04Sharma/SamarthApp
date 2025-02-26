import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  LinearProgress,
  Paper,
  Grid,
  Card,
  CardContent,
  Fade
} from '@mui/material';
import {
  RemoveRedEye as EyeIcon,
  Speed as SpeedIcon,
  Timeline as AccuracyIcon,
  Waves as SmoothnessIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import AssessmentLayout from '../common/AssessmentLayout';
import { initializeModels, detectFaces, processEyeMovement } from '../../services/mlService';
import { assessmentService, assessmentTypes } from '../../services/assessmentService';

// MetricCard component for real-time metrics display
const MetricCard = ({ title, value, icon: Icon, description, color }) => (
  <Card sx={{ height: '100%', bgcolor: `${color}10` }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Icon sx={{ color: color }} />
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" gutterBottom color={color}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
);

// Grid positions for targets
const GRID_POSITIONS = [
  { x: 20, y: 20, label: '1' },
  { x: 50, y: 20, label: '2' },
  { x: 80, y: 20, label: '3' },
  { x: 20, y: 50, label: '4' },
  { x: 50, y: 50, label: '5' },
  { x: 80, y: 50, label: '6' },
  { x: 20, y: 80, label: '7' },
  { x: 50, y: 80, label: '8' },
  { x: 80, y: 80, label: '9' }
];

const Target = ({ x, y, label, isActive, onComplete }) => (
  <Box
    sx={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      width: 40,
      height: 40,
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      bgcolor: isActive ? 'success.main' : 'action.disabled',
      color: 'white',
      fontSize: '20px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: '2px solid',
      borderColor: isActive ? 'success.light' : 'transparent',
      boxShadow: isActive ? '0 0 15px rgba(76, 175, 80, 0.5)' : 'none',
      '&:hover': {
        transform: isActive ? 'translate(-50%, -50%) scale(1.1)' : 'translate(-50%, -50%)'
      }
    }}
    onClick={isActive ? onComplete : undefined}
  >
    {label}
  </Box>
);

const Instructions = ({ currentTarget }) => (
  <Alert 
    severity="info" 
    sx={{ 
      position: 'absolute',
      top: 16,
      left: 16,
      right: 16,
      backgroundColor: 'rgba(255,255,255,0.9)',
      '& .MuiAlert-message': { color: 'text.primary' }
    }}
  >
    Look at Target #{currentTarget} and click it when your eyes are focused on it
  </Alert>
);

// Add new ResultsSection component after the MetricCard component
const ResultsSection = ({ metrics, realtimeData }) => {
  if (!metrics) return null;

  const getScoreInterpretation = (score) => {
    if (score >= 90) return { text: 'Excellent', color: '#4caf50' };
    if (score >= 75) return { text: 'Good', color: '#2196f3' };
    if (score >= 60) return { text: 'Fair', color: '#ff9800' };
    return { text: 'Needs Improvement', color: '#f44336' };
  };

  const overallScore = Math.round(
    (parseFloat(metrics.accuracy) + parseFloat(metrics.smoothness)) / 2
  );

  const interpretation = getScoreInterpretation(overallScore);

  return (
    <Box sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          Assessment Results
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h3" sx={{ color: interpretation.color, mb: 1 }}>
                {overallScore}%
              </Typography>
              <Typography variant="h6" sx={{ color: interpretation.color }}>
                {interpretation.text}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overall Performance Score
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Detailed Metrics:
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body1" gutterBottom>
                  • Accuracy: {metrics.accuracy}% (Target focusing precision)
                </Typography>
                <Typography variant="body1" gutterBottom>
                  • Speed: {metrics.speed} px/s (Movement velocity)
                </Typography>
                <Typography variant="body1" gutterBottom>
                  • Smoothness: {metrics.smoothness}% (Movement consistency)
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Performance Analysis:
            </Typography>
            <Box sx={{ pl: 2 }}>
              {parseFloat(metrics.accuracy) >= 75 ? (
                <Typography variant="body2" color="success.main" gutterBottom>
                  ✓ Good eye focusing accuracy
                </Typography>
              ) : (
                <Typography variant="body2" color="warning.main" gutterBottom>
                  ! Consider practicing focusing on specific points
                </Typography>
              )}
              
              {parseFloat(metrics.smoothness) >= 75 ? (
                <Typography variant="body2" color="success.main" gutterBottom>
                  ✓ Smooth eye movement control
                </Typography>
              ) : (
                <Typography variant="body2" color="warning.main" gutterBottom>
                  ! Work on maintaining steady eye movements
                </Typography>
              )}
              
              {parseFloat(metrics.speed) >= 50 ? (
                <Typography variant="body2" color="success.main" gutterBottom>
                  ✓ Good movement speed
                </Typography>
              ) : (
                <Typography variant="body2" color="warning.main" gutterBottom>
                  ! Practice moving between targets more quickly
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Performance Timeline
          </Typography>
          <Line 
            data={{
              labels: realtimeData.timestamps.map(t => ''),
              datasets: [
                {
                  label: 'Accuracy',
                  data: realtimeData.accuracy,
                  borderColor: '#2196f3',
                  fill: false
                },
                {
                  label: 'Smoothness',
                  data: realtimeData.smoothness,
                  borderColor: '#4caf50',
                  fill: false
                }
              ]
            }}
            options={{
              responsive: true,
              scales: {
                y: { 
                  min: 0, 
                  max: 100,
                  title: {
                    display: true,
                    text: 'Score (%)'
                  }
                }
              },
              plugins: {
                legend: {
                  display: true,
                  position: 'top'
                }
              }
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

// Add this new component at the top with other components
const SetupGuide = () => (
  <Box sx={{ 
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    textAlign: 'center',
    bgcolor: 'rgba(255,255,255,0.9)',
    p: 3,
    borderRadius: 2,
    boxShadow: 3
  }}>
    <Typography variant="h6" gutterBottom color="primary">
      Camera Setup Guide
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
      <Typography variant="body1">✓ Face the camera directly</Typography>
      <Typography variant="body1">✓ Ensure your face is well-lit</Typography>
      <Typography variant="body1">✓ Keep about arm's length distance</Typography>
      <Typography variant="body1">✓ Remove glasses if possible</Typography>
      <Typography variant="body1">✓ Avoid backlighting</Typography>
    </Box>
    <Box 
      component="img" 
      src="/images/face-position-guide.png" 
      alt="Face Position Guide"
      sx={{ 
        width: '200px', 
        height: '150px', 
        objectFit: 'contain',
        mb: 2,
        display: 'block',
        mx: 'auto'
      }}
    />
  </Box>
);

const EyeMovement = ({ userId, onComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [realtimeData, setRealtimeData] = useState({
    accuracy: [],
    speed: [],
    smoothness: [],
    timestamps: []
  });
  const [faceDetected, setFaceDetected] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const calibrationTimeoutRef = useRef(null);
  const [showSetupGuide, setShowSetupGuide] = useState(true);
  const faceDetectionAttemptsRef = useRef(0);
  const MAX_FACE_DETECTION_ATTEMPTS = 5;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const analysisRef = useRef(null);
  const streamRef = useRef(null);
  const measurementsRef = useRef([]);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeModels();
        setIsLoading(false);
      } catch (err) {
        setError('Failed to initialize. Please refresh and try again.');
        setIsLoading(false);
      }
    };
    init();

    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (analysisRef.current) {
      cancelAnimationFrame(analysisRef.current);
    }
  };

  const processFrame = async () => {
    if (!videoRef.current || !isAssessing) return;

    try {
      const detections = await detectFaces(videoRef.current);
      
      const hasFace = detections.length > 0;
      setFaceDetected(hasFace);
      
      if (hasFace) {
        const detection = detections[0];
        const landmarks = detection.landmarks;
        
        drawFaceLandmarks(canvasRef.current, landmarks);

        const currentTarget = GRID_POSITIONS[currentTargetIndex];
        const movement = processEyeMovement(landmarks, { x: currentTarget.x, y: currentTarget.y });
        
        if (movement) {
          updateMetrics(movement);
        }
      }

      if (isAssessing) {
        analysisRef.current = requestAnimationFrame(processFrame);
      }
    } catch (err) {
      console.error('Frame processing error:', err);
      setFaceDetected(false);
    }
  };

  const drawFaceLandmarks = (canvas, landmarks) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;

    [leftEye, rightEye].forEach(eye => {
      ctx.beginPath();
      eye.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();
    });
  };

  const updateMetrics = (movement) => {
    const timestamp = Date.now();
    const target = GRID_POSITIONS[currentTargetIndex];
    
    if (!movement || !movement.averageGaze || !target) {
      console.warn('Invalid movement data:', {
        movement,
        hasAverageGaze: movement?.averageGaze ? 'yes' : 'no',
        target
      });
      return;
    }

    const accuracy = calculateAccuracy(movement, target) || 0;
    const speed = calculateSpeed(movement) || 0;
    const smoothness = calculateSmoothness(movement) || 0;

    console.log('Calculated metrics:', { accuracy, speed, smoothness });

    if (!isNaN(accuracy) && !isNaN(speed) && !isNaN(smoothness)) {
      measurementsRef.current.push({ 
        accuracy, 
        speed, 
        smoothness, 
        timestamp,
        targetIndex: currentTargetIndex 
      });

      setRealtimeData(prev => ({
        accuracy: [...prev.accuracy, accuracy],
        speed: [...prev.speed, speed],
        smoothness: [...prev.smoothness, smoothness],
        timestamps: [...prev.timestamps, timestamp]
      }));

      setMetrics({
        accuracy: accuracy.toFixed(1),
        speed: speed.toFixed(1),
        smoothness: smoothness.toFixed(1)
      });
    } else {
      console.warn('Invalid metric values:', { accuracy, speed, smoothness });
    }
  };

  const calculateAccuracy = (movement, target) => {
    try {
      const normalizedX = (movement.averageGaze.x / videoRef.current.videoWidth) * 100;
      const normalizedY = (movement.averageGaze.y / videoRef.current.videoHeight) * 100;

      const distance = Math.sqrt(
        Math.pow(normalizedX - target.x, 2) + 
        Math.pow(normalizedY - target.y, 2)
      );

      const accuracy = Math.max(0, 100 - (distance * 100 / 141.4));
      return accuracy;
    } catch (err) {
      console.warn('Error calculating accuracy:', err);
      return 0;
    }
  };

  const calculateSpeed = (movement) => {
    try {
      if (!movement.previousGaze) {
        return 0;
      }

      const dx = movement.averageGaze.x - movement.previousGaze.x;
      const dy = movement.averageGaze.y - movement.previousGaze.y;
      
      const speed = Math.sqrt(dx * dx + dy * dy) * 60;
      
      return Math.min(100, (speed / 500) * 100);
    } catch (err) {
      console.warn('Error calculating speed:', err);
      return 0;
    }
  };

  const calculateSmoothness = (movement) => {
    try {
      if (!movement.leftEye || !movement.rightEye) {
        return 0;
      }

      const jitter = Math.abs(movement.leftEye.x - movement.rightEye.x) + 
                    Math.abs(movement.leftEye.y - movement.rightEye.y);
      
      const smoothness = Math.max(0, 100 - (jitter * 5));
      return smoothness;
    } catch (err) {
      console.warn('Error calculating smoothness:', err);
      return 0;
    }
  };

  // Add this new function
  const checkFaceDetection = async () => {
    try {
      const detections = await detectFaces(videoRef.current);
      const hasFace = detections.length > 0;
      setFaceDetected(hasFace);
      
      if (hasFace) {
        setShowSetupGuide(false);
        return true;
      }
      
      faceDetectionAttemptsRef.current++;
      if (faceDetectionAttemptsRef.current >= MAX_FACE_DETECTION_ATTEMPTS) {
        setError('Face detection failed. Please check lighting and camera position.');
        return false;
      }
      
      return false;
    } catch (err) {
      console.error('Face detection check error:', err);
      return false;
    }
  };

  // Modify startAssessment function
  const startAssessment = async () => {
    try {
      setError(null);
      faceDetectionAttemptsRef.current = 0;
      setCalibrating(true);
      
      // Request camera access with optimal settings
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        }
      });

      // Set up video element
      if (!videoRef.current) {
        throw new Error('Video element not initialized');
      }

      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      // Wait for video to be fully ready
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Video initialization timeout'));
        }, 10000);

        videoRef.current.onloadedmetadata = () => {
          videoRef.current.onloadeddata = async () => {
            try {
              await videoRef.current.play();
              clearTimeout(timeoutId);
              resolve();
            } catch (err) {
              clearTimeout(timeoutId);
              reject(err);
            }
          };
        };

        videoRef.current.onerror = (err) => {
          clearTimeout(timeoutId);
          reject(new Error(`Video error: ${err.message}`));
        };
      });

      // Ensure video is actually playing and has dimensions
      if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
        throw new Error('Video dimensions not available');
      }

      // Set up canvas with correct dimensions
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      // Initialize assessment state
      setIsAssessing(true);
      setCurrentTargetIndex(0);
      setProgress(0);
      measurementsRef.current = [];
      setMetrics(null);
      setRealtimeData({
        accuracy: [],
        speed: [],
        smoothness: [],
        timestamps: []
      });
      
      // Start face detection check loop with proper video readiness check
      let checkAttempts = 0;
      const MAX_CHECK_ATTEMPTS = 10;
      const CHECK_INTERVAL = 1000;

      const checkInterval = setInterval(async () => {
        checkAttempts++;

        // Verify video element is still valid and ready
        if (!videoRef.current || 
            !videoRef.current.videoWidth || 
            !videoRef.current.videoHeight || 
            videoRef.current.readyState !== 4) {
          console.log('Waiting for video to be ready...', {
            hasVideo: !!videoRef.current,
            width: videoRef.current?.videoWidth,
            height: videoRef.current?.videoHeight,
            readyState: videoRef.current?.readyState
          });

          if (checkAttempts >= MAX_CHECK_ATTEMPTS) {
            clearInterval(checkInterval);
            cleanup();
            setIsAssessing(false);
            setCalibrating(false);
            setError('Video failed to initialize properly. Please try again.');
            return;
          }
          return;
        }

        try {
          const faceDetected = await checkFaceDetection();
          if (faceDetected) {
            clearInterval(checkInterval);
            setCalibrating(false);
            processFrame();
          } else if (faceDetectionAttemptsRef.current >= MAX_FACE_DETECTION_ATTEMPTS) {
            clearInterval(checkInterval);
            cleanup();
            setIsAssessing(false);
            setCalibrating(false);
            setError('Unable to detect face. Please check lighting and camera position.');
          }
        } catch (err) {
          console.error('Face detection check error:', err);
          if (checkAttempts >= MAX_CHECK_ATTEMPTS) {
            clearInterval(checkInterval);
            cleanup();
            setIsAssessing(false);
            setCalibrating(false);
            setError('Face detection failed. Please try again.');
          }
        }
      }, CHECK_INTERVAL);

      // Clear interval after timeout
      setTimeout(() => {
        clearInterval(checkInterval);
        if (calibrating) {
          cleanup();
          setIsAssessing(false);
          setCalibrating(false);
          setError('Face detection timed out. Please try again with better lighting.');
        }
      }, 15000); // Increased timeout to allow for proper initialization

    } catch (err) {
      console.error('Start assessment error:', err);
      cleanup();
      setIsAssessing(false);
      setCalibrating(false);
      setError(`Failed to start assessment: ${err.message}`);
    }
  };

  const handleTargetComplete = () => {
    const newIndex = currentTargetIndex + 1;
    const newProgress = (newIndex / GRID_POSITIONS.length) * 100;

    if (newIndex < GRID_POSITIONS.length) {
      setCurrentTargetIndex(newIndex);
      setProgress(newProgress);
    } else {
      stopAssessment();
    }
  };

  const stopAssessment = async () => {
    cleanup();
    setIsAssessing(false);
    setProgress(100);

    if (measurementsRef.current.length > 0) {
      const finalMetrics = {
        accuracy: average(measurementsRef.current.map(m => m.accuracy)) || 0,
        speed: average(measurementsRef.current.map(m => m.speed)) || 0,
        smoothness: average(measurementsRef.current.map(m => m.smoothness)) || 0
      };

      setMetrics({
        accuracy: isNaN(finalMetrics.accuracy) ? '0.0' : finalMetrics.accuracy.toFixed(1),
        speed: isNaN(finalMetrics.speed) ? '0.0' : finalMetrics.speed.toFixed(1),
        smoothness: isNaN(finalMetrics.smoothness) ? '0.0' : finalMetrics.smoothness.toFixed(1)
      });

      try {
        await assessmentService.saveAssessment(userId, assessmentTypes.EYE_MOVEMENT, {
          data: measurementsRef.current,
          metrics: finalMetrics,
          status: 'COMPLETED'
        });
      } catch (err) {
        setError('Failed to save assessment results, but you can still view them below.');
      }
    } else {
      setMetrics({
        accuracy: '0.0',
        speed: '0.0',
        smoothness: '0.0'
      });
      setError('No valid measurements were recorded. Please try the assessment again.');
    }
  };

  const handleComplete = () => {
    if (onComplete && metrics) {
      onComplete(metrics);
    }
  };

  const average = (arr) => {
    if (!arr || arr.length === 0) return 0;
    const validNumbers = arr.filter(n => !isNaN(n));
    return validNumbers.length > 0 ? validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length : 0;
  };

  // Render metrics cards
  const renderMetrics = () => {
    if (!metrics) return null;

    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Accuracy"
            value={`${metrics.accuracy}%`}
            icon={AccuracyIcon}
            description="How well your eyes focus on the target"
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Speed"
            value={`${metrics.speed} px/s`}
            icon={SpeedIcon}
            description="Eye movement velocity"
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Smoothness"
            value={`${metrics.smoothness}%`}
            icon={SmoothnessIcon}
            description="Movement consistency"
            color="#ff9800"
          />
        </Grid>
      </Grid>
    );
  };

  // Render real-time charts
  const renderCharts = () => {
    if (!realtimeData.timestamps.length) return null;

    const chartOptions = {
      responsive: true,
      animation: false,
      scales: {
        y: { min: 0, max: 100 }
      }
    };

    const accuracyData = {
      labels: realtimeData.timestamps.map(t => ''),
      datasets: [{
        label: 'Accuracy',
        data: realtimeData.accuracy,
        borderColor: '#2196f3',
        fill: false
      }]
    };

    return (
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Real-time Performance
              </Typography>
              <Line data={accuracyData} options={chartOptions} />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Clean up calibration timeout
  useEffect(() => {
    return () => {
      if (calibrationTimeoutRef.current) {
        clearTimeout(calibrationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AssessmentLayout
      title="Eye Movement Assessment"
      description={
        <Box>
          <Typography variant="body1" gutterBottom>
            Focus on each numbered target in sequence. Click each target when your eyes are focused on it.
            Keep your head still and only move your eyes.
          </Typography>
          {calibrating && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Setting up camera and face detection...
              </Typography>
              <LinearProgress sx={{ mt: 1 }} />
              {faceDetected && (
                <Typography color="success.main" sx={{ mt: 1 }}>
                  Face detected! Starting assessment...
                </Typography>
              )}
            </Alert>
          )}
          <Box sx={{ mt: 2, mb: 3 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Progress: {Math.round(progress)}%
            </Typography>
          </Box>
        </Box>
      }
      isLoading={isLoading}
      isAssessing={isAssessing}
      error={error}
      onStart={startAssessment}
      onStop={stopAssessment}
      showCompleteButton={!isAssessing && metrics !== null}
      onComplete={handleComplete}
      completeButtonText="Save and Continue"
    >
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 640, mx: 'auto' }}>
        <Box sx={{ position: 'relative', paddingTop: '75%', bgcolor: 'black', borderRadius: 2 }}>
          <video
            ref={videoRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: 'scaleX(-1)'
            }}
            autoPlay
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: 'scaleX(-1)'
            }}
          />
          
          {showSetupGuide && !faceDetected && (
            <SetupGuide />
          )}
          
          {!faceDetected && isAssessing && !calibrating && (
            <Alert 
              severity="warning" 
              sx={{ 
                position: 'absolute',
                top: 16,
                left: 16,
                right: 16,
                backgroundColor: 'rgba(255,255,255,0.9)'
              }}
            >
              <Typography variant="body1" gutterBottom>
                Face not detected. Please ensure:
              </Typography>
              <ul>
                <li>Your face is clearly visible</li>
                <li>You have good lighting</li>
                <li>You're at arm's length from the camera</li>
                <li>You're facing the camera directly</li>
              </ul>
            </Alert>
          )}
          
          {isAssessing && faceDetected && !calibrating && (
            <>
              <Instructions currentTarget={GRID_POSITIONS[currentTargetIndex].label} />
              {GRID_POSITIONS.map((pos, index) => (
                <Fade key={pos.label} in={true}>
                  <Box>
                    <Target
                      {...pos}
                      isActive={index === currentTargetIndex}
                      onComplete={handleTargetComplete}
                    />
                  </Box>
                </Fade>
              ))}
            </>
          )}
        </Box>

        {!isAssessing && metrics && (
          <ResultsSection metrics={metrics} realtimeData={realtimeData} />
        )}
      </Box>
    </AssessmentLayout>
  );
};

export default EyeMovement; 
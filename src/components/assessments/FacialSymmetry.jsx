import { useState, useRef, useEffect } from 'react';
import { Box, Button, Grid } from '@mui/material';
import AssessmentLayout from '../common/AssessmentLayout';
import { MLService } from '../../services/mlService';
import { assessmentService, assessmentTypes } from '../../services/assessmentService';
import PropTypes from 'prop-types';

const FacialSymmetry = ({ userId, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [symmetryData, setSymmetryData] = useState(null);
  const assessmentStartTime = useRef(null);

  useEffect(() => {
    if (!userId) {
      setError('User ID is required for assessment');
      console.error('FacialSymmetry component: userId prop is required');
    }
  }, [userId]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureImage = async () => {
    if (!videoRef.current) return;

    try {
      // Create canvas and draw video frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Get image data
      const imageData = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageData);

      // Convert data URL to blob
      const blob = await fetch(imageData).then(res => res.blob());

      // Use Python ML service to analyze facial symmetry
      const results = await MLService.analyzeFace(blob);
      
      if (results.success) {
        // Make sure we structure the data correctly
        const symmetryData = {
          symmetryScore: results.symmetry_score,
          metrics: {
            landmarks: results.landmarks || {}, // Ensure landmarks exist
            eyeSymmetry: results.metrics?.eye_symmetry || 0,
            mouthSymmetry: results.metrics?.mouth_symmetry || 0,
            jawSymmetry: results.metrics?.jaw_symmetry || 0
          },
          timestamp: Date.now()
        };

        setSymmetryData(symmetryData);

        // Update metrics for display
        const currentMetrics = {
          symmetryScore: symmetryData.symmetryScore.toFixed(2),
          eyeSymmetry: symmetryData.metrics.eyeSymmetry.toFixed(3),
          mouthSymmetry: symmetryData.metrics.mouthSymmetry.toFixed(3),
          timestamp: new Date().toISOString()
        };
        setMetrics(currentMetrics);
      } else {
        setError(results.error || 'No face detected. Please try again.');
      }
    } catch (err) {
      console.error('Error analyzing facial symmetry:', err);
      setError('Error analyzing facial symmetry. Please try again.');
    }
  };

  const startAssessment = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsAssessing(true);
      setError(null);
      setCapturedImage(null);
      setSymmetryData(null);
      assessmentStartTime.current = Date.now();
    } catch (err) {
      setError('Failed to access camera. Please check camera permissions and try again.');
    }
  };

  const stopAssessment = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsAssessing(false);

    if (metrics && symmetryData) {
      try {
        // Check for auth token
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to save assessment results');
          return;
        }

        // Format metrics for saving - ensure metrics is a top-level object
        const formattedMetrics = {
          symmetryScore: parseFloat(metrics.symmetryScore) || 0,
          eyeSymmetry: parseFloat(metrics.eyeSymmetry) || 0,
          mouthSymmetry: parseFloat(metrics.mouthSymmetry) || 0,
          overallSymmetry: parseFloat(metrics.symmetryScore) || 0,
          eyeAlignment: parseFloat(metrics.eyeSymmetry) || 0,
          mouthAlignment: parseFloat(metrics.mouthSymmetry) || 0,
          jawSymmetry: symmetryData.metrics.jawSymmetry || 0,
          landmarks: symmetryData.metrics.landmarks || {}
        };

        console.log('Saving assessment with metrics:', formattedMetrics);

        // Save assessment results
        await assessmentService.saveAssessment(
          userId,
          assessmentTypes.FACIAL_SYMMETRY,
          formattedMetrics
        );

        if (onComplete) {
          onComplete({
            data: formattedMetrics,
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Error saving assessment results:', err);
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('Error saving assessment results. Please try again.');
        }
      }
    } else {
      setError('No assessment data available to save.');
    }
  };

  const renderSymmetryOverlay = () => {
    if (!symmetryData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Only proceed if we have landmarks
    if (!symmetryData.metrics || !symmetryData.metrics.landmarks) {
      return;
    }

    // Draw facial landmarks
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;

    // Safely handle landmarks drawing
    const landmarks = symmetryData.metrics.landmarks;
    Object.entries(landmarks).forEach(([key, points]) => {
      if (Array.isArray(points) && points.length > 0) {
        ctx.beginPath();
        points.forEach((point, index) => {
          if (point && typeof point.x === 'number' && typeof point.y === 'number') {
            if (index === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          }
        });
        ctx.stroke();
      }
    });
  };

  useEffect(() => {
    if (symmetryData && canvasRef.current) {
      renderSymmetryOverlay();
    }
  }, [symmetryData]);

  const actions = (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {isAssessing && !capturedImage && (
        <Button
          variant="contained"
          color="secondary"
          onClick={captureImage}
          sx={{ minWidth: 150 }}
        >
          Capture
        </Button>
      )}
      <Button
        variant="contained"
        color={isAssessing ? 'error' : 'primary'}
        onClick={isAssessing ? stopAssessment : startAssessment}
        sx={{ minWidth: 150 }}
      >
        {isAssessing ? 'Stop Assessment' : 'Start Assessment'}
      </Button>
    </Box>
  );

  return (
    <AssessmentLayout
      title="Facial Symmetry Assessment"
      description="This assessment will analyze your facial symmetry. Look straight at the camera with a neutral expression."
      isLoading={isLoading}
      isAssessing={isAssessing}
      error={error}
      onStart={startAssessment}
      onStop={stopAssessment}
      metrics={metrics}
      actions={actions}
    >
      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={12} md={capturedImage ? 6 : 12}>
          <Box sx={{ width: '100%', aspectRatio: '4/3', bgcolor: 'black', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            />
          </Box>
        </Grid>

        {capturedImage && (
          <Grid item xs={12} md={6}>
            <Box sx={{ width: '100%', aspectRatio: '4/3', bgcolor: 'black', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
              <img
                src={capturedImage}
                alt="Captured face"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          </Grid>
        )}
      </Grid>
    </AssessmentLayout>
  );
};

FacialSymmetry.propTypes = {
  userId: PropTypes.string.isRequired,
  onComplete: PropTypes.func
};

export default FacialSymmetry; 
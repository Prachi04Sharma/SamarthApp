import { useState, useRef, useEffect } from 'react';
import { Box, Button, Grid } from '@mui/material';
import AssessmentLayout from '../common/AssessmentLayout';
import { MLService } from '../../services/mlService';
import { assessmentService, assessmentTypes } from '../../services/assessmentService';
import PropTypes from 'prop-types';
import { specializedAssessments } from '../../services/api';
import { saveFacialAssessment } from '../../services/assessments/facialService';

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
        const assessmentData = {
          userId,
          metrics: {
            overallSymmetry: parseFloat(metrics.symmetryScore),
            eyeSymmetry: {
              left: symmetryData.metrics.leftEye || {},
              right: symmetryData.metrics.rightEye || {},
              alignmentScore: parseFloat(metrics.eyeSymmetry)
            },
            mouthSymmetry: {
              centerDeviation: symmetryData.metrics.mouthCenter || 0,
              cornerAlignment: symmetryData.metrics.mouthCorners || 0,
              symmetryScore: parseFloat(metrics.mouthSymmetry)
            },
            jawSymmetry: {
              leftAngle: symmetryData.metrics.jawLeft || 0,
              rightAngle: symmetryData.metrics.jawRight || 0,
              symmetryScore: symmetryData.metrics.jawSymmetry || 0
            },
            landmarks: symmetryData.metrics.landmarks || {}
          }
        };

        const result = await saveFacialAssessment(assessmentData);

        if (onComplete) {
          onComplete(result);
        }
      } catch (error) {
        console.error('Error saving facial symmetry assessment:', error);
        setError(error.message || 'Failed to save assessment results');
      }
    }
  };

  useEffect(() => {
    const fetchBaseline = async () => {
      try {
        const response = await specializedAssessments.facialSymmetry.getBaseline(userId);
        if (response.data.data) {
          // Use baseline data for comparison
          console.log('Baseline data:', response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch baseline:', error);
      }
    };

    if (userId) {
      fetchBaseline();
    }
  }, [userId]);

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
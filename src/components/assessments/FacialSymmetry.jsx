import { useState, useRef, useEffect } from 'react';
import { Box, Button, Grid } from '@mui/material';
import AssessmentLayout from '../common/AssessmentLayout';
import { initializeModels, detectFaces, processFacialMetrics } from '../../services/mlService';
import { assessmentService, assessmentTypes } from '../../services/assessmentService';

const FacialSymmetry = ({ userId, onComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
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
    const loadModels = async () => {
      try {
        await initializeModels();
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load ML models. Please refresh the page and try again.');
        setIsLoading(false);
      }
    };
    loadModels();

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

      // Analyze facial symmetry
      const detections = await detectFaces(videoRef.current);
      if (detections.length > 0) {
        const metrics = processFacialMetrics(detections[0]);
        setSymmetryData({
          symmetryScore: metrics.symmetryScore,
          landmarks: metrics.landmarks,
          expressions: metrics.expressions,
          timestamp: Date.now()
        });

        // Update metrics
        const currentMetrics = {
          symmetryScore: metrics.symmetryScore.toFixed(2),
          expressions: metrics.expressions,
          landmarks: metrics.landmarks,
          timestamp: new Date().toISOString()
        };
        setMetrics(currentMetrics);
      } else {
        setError('No face detected. Please try again.');
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

    if (symmetryData) {
      try {
        // Save assessment results
        await assessmentService.saveAssessment(
          userId,
          assessmentTypes.FACIAL_SYMMETRY,
          symmetryData
        );

        if (onComplete) {
          onComplete(symmetryData);
        }
      } catch (err) {
        console.error('Error saving assessment results:', err);
        setError('Error saving assessment results. Your progress may not be saved.');
      }
    }
  };

  const renderSymmetryOverlay = () => {
    if (!symmetryData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw facial landmarks
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;

    Object.values(symmetryData.landmarks).forEach(points => {
      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
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
      description="This assessment will analyze your facial symmetry and expressions. Look straight at the camera with a neutral expression."
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

export default FacialSymmetry; 
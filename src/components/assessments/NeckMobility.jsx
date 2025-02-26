import { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import AssessmentLayout from '../common/AssessmentLayout';
import { initializeModels, detectFaces, processFacialMetrics } from '../../services/mlService';
import { assessmentService, assessmentTypes } from '../../services/assessmentService';

const NeckMobility = ({ userId, onComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameProcessorRef = useRef(null);
  const [mobilityData, setMobilityData] = useState([]);
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
      if (frameProcessorRef.current) {
        cancelAnimationFrame(frameProcessorRef.current);
      }
    };
  }, []);

  const processFrame = async () => {
    if (!videoRef.current || !isAssessing) return;

    try {
      const detections = await detectFaces(videoRef.current);
      
      if (detections.length > 0) {
        const detection = detections[0];
        const metrics = processFacialMetrics(detection);
        
        const timestamp = Date.now();
        const newData = {
          timestamp,
          faceAngle: metrics.faceAngle,
          landmarks: metrics.landmarks
        };
        
        setMobilityData(prev => [...prev, newData]);

        // Update metrics in real-time
        const currentMetrics = calculateMetrics([...mobilityData, newData]);
        setMetrics(currentMetrics);
      }

      frameProcessorRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      console.error('Frame processing error:', err);
      setError('Error processing neck mobility. Please try again.');
      stopAssessment();
    }
  };

  const calculateMetrics = (data) => {
    if (data.length < 2) return null;

    // Calculate range of motion
    const rollAngles = data.map(point => point.faceAngle.roll);
    const yawAngles = data.map(point => point.faceAngle.yaw);

    const rollRange = {
      min: Math.min(...rollAngles),
      max: Math.max(...rollAngles)
    };
    rollRange.total = Math.abs(rollRange.max - rollRange.min);

    const yawRange = {
      min: Math.min(...yawAngles),
      max: Math.max(...yawAngles)
    };
    yawRange.total = Math.abs(yawRange.max - yawRange.min);

    // Calculate movement speed
    const rollSpeeds = rollAngles.map((angle, i) => 
      i > 0 ? Math.abs(angle - rollAngles[i-1]) : 0
    ).slice(1);

    const yawSpeeds = yawAngles.map((angle, i) => 
      i > 0 ? Math.abs(angle - yawAngles[i-1]) : 0
    ).slice(1);

    const averageSpeed = {
      roll: rollSpeeds.reduce((a, b) => a + b, 0) / rollSpeeds.length,
      yaw: yawSpeeds.reduce((a, b) => a + b, 0) / yawSpeeds.length
    };

    // Calculate movement stability
    const rollVariance = calculateVariance(rollSpeeds);
    const yawVariance = calculateVariance(yawSpeeds);
    const stability = Math.max(0, 100 - ((rollVariance + yawVariance) * 10));

    const duration = ((data[data.length - 1].timestamp - assessmentStartTime.current) / 1000).toFixed(1);

    return {
      rollRange,
      yawRange,
      averageSpeed,
      stability: stability.toFixed(2),
      dataPoints: data.length,
      duration
    };
  };

  const calculateVariance = (values) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  };

  const startAssessment = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsAssessing(true);
      setError(null);
      setMobilityData([]);
      assessmentStartTime.current = Date.now();
      
      // Start processing frames
      processFrame();
    } catch (err) {
      setError('Failed to access camera. Please check camera permissions and try again.');
    }
  };

  const stopAssessment = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (frameProcessorRef.current) {
      cancelAnimationFrame(frameProcessorRef.current);
    }
    setIsAssessing(false);

    // Calculate final metrics
    if (mobilityData.length > 0) {
      const finalMetrics = calculateMetrics(mobilityData);
      setMetrics(finalMetrics);

      try {
        // Save assessment results
        await assessmentService.saveAssessment(
          userId,
          assessmentTypes.NECK_MOBILITY,
          finalMetrics
        );

        if (onComplete) {
          onComplete(finalMetrics);
        }
      } catch (err) {
        console.error('Error saving assessment results:', err);
        setError('Error saving assessment results. Your progress may not be saved.');
      }
    }
  };

  return (
    <AssessmentLayout
      title="Neck Mobility Assessment"
      description="This assessment will measure your neck's range of motion and movement patterns. Slowly turn your head left to right, then up and down while keeping your shoulders still."
      isLoading={isLoading}
      isAssessing={isAssessing}
      error={error}
      onStart={startAssessment}
      onStop={stopAssessment}
      metrics={metrics}
    >
      <Box sx={{ width: '100%', maxWidth: 640, aspectRatio: '4/3', bgcolor: 'black', borderRadius: 2, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
        />
      </Box>
    </AssessmentLayout>
  );
};

export default NeckMobility; 
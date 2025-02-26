import { useState, useEffect, useRef } from 'react';
import { Box, Paper } from '@mui/material';
import AssessmentLayout from '../common/AssessmentLayout';
import { assessmentService, assessmentTypes } from '../../services/assessmentService';

const Tremor = ({ userId, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [motionData, setMotionData] = useState([]);
  const assessmentStartTime = useRef(null);
  const assessmentDuration = 10; // seconds

  useEffect(() => {
    let interval;
    if (isAssessing) {
      interval = setInterval(() => {
        const elapsedTime = (Date.now() - assessmentStartTime.current) / 1000;
        if (elapsedTime >= assessmentDuration) {
          stopAssessment();
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isAssessing]);

  const handleMotionEvent = (event) => {
    if (!isAssessing) return;

    const { acceleration, rotationRate, interval } = event;
    if (acceleration && rotationRate) {
      const newData = {
        timestamp: Date.now(),
        acceleration: {
          x: acceleration.x || 0,
          y: acceleration.y || 0,
          z: acceleration.z || 0
        },
        rotation: {
          alpha: rotationRate.alpha || 0,
          beta: rotationRate.beta || 0,
          gamma: rotationRate.gamma || 0
        },
        interval
      };

      setMotionData(prev => [...prev, newData]);

      // Update metrics in real-time
      const currentMetrics = calculateMetrics([...motionData, newData]);
      setMetrics(currentMetrics);
    }
  };

  const calculateMetrics = (data) => {
    if (data.length < 2) return null;

    // Calculate acceleration magnitude for each sample
    const magnitudes = data.map(point => 
      Math.sqrt(
        Math.pow(point.acceleration.x, 2) +
        Math.pow(point.acceleration.y, 2) +
        Math.pow(point.acceleration.z, 2)
      )
    );

    // Calculate rotation magnitude for each sample
    const rotationMagnitudes = data.map(point =>
      Math.sqrt(
        Math.pow(point.rotation.alpha, 2) +
        Math.pow(point.rotation.beta, 2) +
        Math.pow(point.rotation.gamma, 2)
      )
    );

    // Calculate tremor frequency using FFT
    const frequencies = calculateFrequencies(magnitudes, data[0].interval);

    // Calculate tremor amplitude (peak-to-peak)
    const amplitude = Math.max(...magnitudes) - Math.min(...magnitudes);

    // Calculate stability (lower variance = more stable)
    const accelerationVariance = calculateVariance(magnitudes);
    const rotationVariance = calculateVariance(rotationMagnitudes);
    const stability = Math.max(0, 100 - ((accelerationVariance + rotationVariance) * 10));

    const duration = ((data[data.length - 1].timestamp - assessmentStartTime.current) / 1000).toFixed(1);

    return {
      frequency: frequencies.dominantFrequency.toFixed(2),
      amplitude: amplitude.toFixed(2),
      stability: stability.toFixed(2),
      dataPoints: data.length,
      duration
    };
  };

  const calculateFrequencies = (samples, interval) => {
    // Simple frequency analysis (can be enhanced with proper FFT)
    const zeroCrossings = samples.reduce((count, value, index) => {
      if (index === 0) return count;
      return (samples[index - 1] < 0 && value >= 0) ? count + 1 : count;
    }, 0);

    const duration = (samples.length * interval) / 1000; // Convert to seconds
    const dominantFrequency = (zeroCrossings / 2) / duration; // Cycles per second

    return {
      dominantFrequency,
      samplingRate: 1000 / interval
    };
  };

  const calculateVariance = (values) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  };

  const startAssessment = async () => {
    try {
      // Check if device motion is available
      if (!window.DeviceMotionEvent) {
        throw new Error('Device motion not supported');
      }

      // Request permission for device motion (iOS 13+)
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Permission not granted');
        }
      }

      // Start collecting motion data
      window.addEventListener('devicemotion', handleMotionEvent);
      setIsAssessing(true);
      setError(null);
      setMotionData([]);
      assessmentStartTime.current = Date.now();
    } catch (err) {
      console.error('Error starting tremor assessment:', err);
      setError('Unable to access motion sensors. Please ensure motion sensors are available and permissions are granted.');
    }
  };

  const stopAssessment = async () => {
    window.removeEventListener('devicemotion', handleMotionEvent);
    setIsAssessing(false);

    // Calculate final metrics
    if (motionData.length > 0) {
      const finalMetrics = calculateMetrics(motionData);
      setMetrics(finalMetrics);

      try {
        // Save assessment results
        await assessmentService.saveAssessment(
          userId,
          assessmentTypes.TREMOR,
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

  const renderDataVisualization = () => {
    if (motionData.length === 0) return null;

    const lastDataPoint = motionData[motionData.length - 1];
    const scale = 50; // Scale factor for visualization

    return (
      <Paper 
        sx={{ 
          p: 2, 
          width: '100%', 
          maxWidth: 400,
          height: 200,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 20,
            height: 20,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            transform: `translate(
              ${lastDataPoint.acceleration.x * scale}px,
              ${lastDataPoint.acceleration.y * scale}px
            )`,
            transition: 'transform 0.3s ease-out'
          }}
        />
      </Paper>
    );
  };

  return (
    <AssessmentLayout
      title="Tremor Assessment"
      description="This assessment will measure tremor frequency and amplitude. Hold your device steady and extend your arms forward."
      isLoading={isLoading}
      isAssessing={isAssessing}
      error={error}
      onStart={startAssessment}
      onStop={stopAssessment}
      metrics={metrics}
    >
      {renderDataVisualization()}
    </AssessmentLayout>
  );
};

export default Tremor; 
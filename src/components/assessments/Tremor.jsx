import { useState, useRef, useEffect } from 'react';
import { Box, Button, Typography, Grid, LinearProgress } from '@mui/material';
import AssessmentLayout from '../common/AssessmentLayout';
import { MLService } from '../../services/mlService';
import { assessmentService, assessmentTypes } from '../../services/assessmentService';

const Tremor = ({ userId, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const recordingDuration = 10; // seconds
  const recordingStartTime = useRef(null);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const startAssessment = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false
      });
      
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsAssessing(true);
      setError(null);
      setMetrics(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please check camera permissions and try again.');
    }
  };

  const startRecording = () => {
    try {
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          await analyzeVideo(blob);
        } catch (err) {
          console.error('Error analyzing video:', err);
          setError('Error analyzing tremor. Please try again.');
        } finally {
          setIsRecording(false);
        }
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      recordingStartTime.current = Date.now();
      
      // Update progress
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - recordingStartTime.current) / 1000;
        const progress = Math.min(100, (elapsed / recordingDuration) * 100);
        setRecordingProgress(progress);
        
        if (elapsed >= recordingDuration) {
          stopRecording();
        }
      }, 100);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const analyzeVideo = async (videoBlob) => {
    try {
      const results = await MLService.analyzeTremor(videoBlob);
      
      if (results.success) {
        setMetrics(results.metrics);
        
        // Save assessment results
        await assessmentService.saveAssessment(
          userId,
          assessmentTypes.TREMOR,
          results.metrics
        );
        
        if (onComplete) {
          onComplete(results.metrics);
        }
      } else {
        setError(results.error || 'Failed to analyze tremor. Please try again.');
      }
    } catch (err) {
      console.error('Error analyzing tremor:', err);
      setError('Error analyzing tremor. Please try again.');
    }
  };

  const stopAssessment = () => {
    if (isRecording) {
      stopRecording();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsAssessing(false);
  };

  return (
    <AssessmentLayout
      title="Tremor Assessment"
      description="This assessment will analyze hand tremors. Hold your hand in front of the camera with fingers extended."
      isLoading={isLoading}
      isAssessing={isAssessing}
      error={error}
      onStart={startAssessment}
      onStop={stopAssessment}
      metrics={metrics}
    >
      <Box sx={{ width: '100%', maxWidth: 640, mx: 'auto' }}>
        <Box sx={{ aspectRatio: '4/3', bgcolor: 'black', borderRadius: 2, overflow: 'hidden' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
        
        {isAssessing && !isRecording && !metrics && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              Hold your hand in front of the camera with fingers extended.
              Keep your hand steady and click "Start Recording".
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={startRecording}
              sx={{ mt: 1 }}
            >
              Start Recording
            </Button>
          </Box>
        )}
        
        {isRecording && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Recording tremor... {Math.round(recordingProgress)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={recordingProgress} 
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
        )}
        
        {metrics && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tremor Analysis Results
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  Frequency: {metrics.tremor_frequency} Hz
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.tremor_frequency < 4 ? 'Normal' : 
                   metrics.tremor_frequency < 7 ? 'Resting Tremor' : 'Action Tremor'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  Amplitude: {metrics.tremor_amplitude}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.tremor_amplitude < 0.5 ? 'Mild' : 
                   metrics.tremor_amplitude < 1.5 ? 'Moderate' : 'Severe'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  Tremor Type: {metrics.tremor_type}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </AssessmentLayout>
  );
};

export default Tremor; 
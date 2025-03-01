import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Typography, Grid, LinearProgress, Card, CardContent, CircularProgress, Fade, Paper, Chip, Stack, Alert, AlertTitle } from '@mui/material';
import { Timeline as TimelineIcon, Waves as WavesIcon, Speed as SpeedIcon, Warning as WarningIcon, CheckCircle } from '@mui/icons-material';
import AssessmentLayout from '../common/AssessmentLayout';
import ErrorBoundary from '../common/ErrorBoundary';
import { MLService } from '../../services/mlService';
import AssessmentError from './AssessmentError';
import { specializedAssessments } from '../../services/api';

const Tremor = ({ userId, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ saving: false, error: null, success: false });
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

  const handleError = (error) => {
    console.error('Tremor assessment error:', error);
    setError('An error occurred during the assessment. Please try again.');
    setIsLoading(false);
    stopAssessment();
  };

  const analyzeVideo = async (videoBlob) => {
    try {
      setIsLoading(true);
      const results = await MLService.analyzeTremor(videoBlob);
      
      if (results.success) {
        if (!results.metrics) {
          throw new Error('No metrics received from analysis');
        }
        setMetrics(results.metrics);
        // Remove automatic saving - we'll wait for the user to click Complete Assessment
      } else {
        throw new Error(results.error || 'Failed to analyze tremor');
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the save function to handle statuses
  const handleSaveAssessment = async () => {
    if (!metrics) return;
    
    try {
      setSaveStatus({ saving: true, error: null, success: false });
      
      const assessmentData = {
        userId,
        type: 'tremor',
        timestamp: new Date().toISOString(),
        metrics: metrics
      };
      
      const response = await specializedAssessments.tremor.save(assessmentData);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Failed to save tremor assessment');
      }
      
      console.log('Tremor assessment saved successfully:', response.data);
      setSaveStatus({ saving: false, error: null, success: true });
      
      // Call onComplete with the assessment data
      if (onComplete) {
        onComplete({
          ...assessmentData,
          id: response.data.data?._id || response.data.data?.id
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error saving tremor assessment:', error);
      setSaveStatus({ saving: false, error: error.message, success: false });
      return null;
    }
  };

  // Add a function to render the save status
  const renderSaveStatus = () => {
    if (saveStatus.saving) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Saving assessment results...
        </Alert>
      );
    }
    if (saveStatus.error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to save: {saveStatus.error}
        </Alert>
      );
    }
    if (saveStatus.success) {
      return (
        <Alert severity="success" sx={{ mt: 2 }}>
          Assessment saved successfully!
        </Alert>
      );
    }
    return null;
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

  const TremorMetricCard = ({ title, value, icon, description, severity }) => {
    const getSeverityColor = (severity) => {
      switch (severity.toLowerCase()) {
        case 'mild': return 'success';
        case 'moderate': return 'warning';
        case 'severe': return 'error';
        default: return 'primary';
      }
    };
  
    return (
      <Card elevation={3} sx={{
        height: '100%',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8]
        }
      }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            {icon}
            <Typography variant="h6" color="primary">
              {title}
            </Typography>
          </Stack>
          <Typography variant="h4" align="center" sx={{ my: 2 }}>
            {typeof value === 'number' ? value.toFixed(2) : value}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {description}
          </Typography>
          {severity && (
            <Chip 
              label={severity}
              color={getSeverityColor(severity)}
              size="small"
              sx={{ width: '100%' }}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <ErrorBoundary 
      fallback={<AssessmentError onRetry={() => window.location.reload()} />}
    >
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
            <Fade in>
              <Box sx={{ mt: 3 }}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
                    Tremor Analysis Results
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <TremorMetricCard
                        title="Frequency"
                        value={metrics.tremor_frequency || 0}
                        icon={<WavesIcon color="primary" />}
                        description={`${metrics.peak_count || 0} peaks detected`}
                        severity={metrics.tremor_type || 'None'}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <TremorMetricCard
                        title="Amplitude"
                        value={metrics.tremor_amplitude}
                        icon={<TimelineIcon color="primary" />}
                        description="Normalized tremor intensity (0-100)"
                        severity={metrics.severity}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <TremorMetricCard
                        title="Tremor Type"
                        value={metrics.tremor_type}
                        icon={<SpeedIcon color="primary" />}
                        description={`Based on ${metrics.tremor_frequency.toFixed(1)} Hz frequency`}
                        severity={metrics.severity}
                      />
                    </Grid>
                  </Grid>
          
                  {metrics.tremor_frequency > 4 && (
                    <Alert 
                      severity="info" 
                      icon={<WarningIcon />}
                      sx={{ mt: 3, borderRadius: 2 }}
                    >
                      <AlertTitle>Clinical Insight</AlertTitle>
                      {metrics.tremor_type === 'Resting' ? 
                        'Resting tremor (4-7 Hz) may indicate parkinsonian conditions.' :
                        'Action/Postural tremor (7-12 Hz) may suggest physiological or essential tremor.'}
                    </Alert>
                  )}

                  {/* Add save status display */}
                  {renderSaveStatus()}

                  {/* Update button to call handleSaveAssessment directly */}
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveAssessment}
                      startIcon={<CheckCircle />}
                      disabled={saveStatus.saving || saveStatus.success}
                      sx={{
                        minWidth: 200,
                        py: 1.5,
                        borderRadius: 2
                      }}
                    >
                      {saveStatus.saving ? 'Saving...' : 
                       saveStatus.success ? 'Assessment Completed' : 
                       'Complete Assessment'}
                    </Button>
                  </Box>
                </Paper>
              </Box>
            </Fade>
          )}
          
          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}
        </Box>
      </AssessmentLayout>
    </ErrorBoundary>
  );
};

export default Tremor;
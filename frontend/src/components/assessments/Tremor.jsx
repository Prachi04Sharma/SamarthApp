import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Typography, Grid, LinearProgress, Card, CardContent, CircularProgress, Fade, Paper, Chip, Stack, Alert, AlertTitle, ButtonGroup } from '@mui/material';
import { 
  Timeline as TimelineIcon, 
  Waves as WavesIcon, 
  Speed as SpeedIcon, 
  Warning as WarningIcon, 
  CheckCircle, 
  PanTool as PanToolIcon,
  VerifiedUser as VerifiedUserIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
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
  const [handPosition, setHandPosition] = useState(null); // 'resting', 'extended', 'action'
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingStartTime = useRef(null);
  const progressIntervalRef = useRef(null);
  
  // Enhanced recording settings
  const recordingDuration = 12; // seconds (increased from 10)
  const maxAttempts = 3;

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
      // Reset state
      setError(null);
      setMetrics(null);
      setHandPosition(null);
      setAttemptCount(0);
      
      // Clean up any previous resources
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Request camera with improved video quality settings
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsAssessing(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please check camera permissions and try again.');
    }
  };

  // Select hand position for assessment
  const selectHandPosition = (position) => {
    setHandPosition(position);
  };

  const startRecording = () => {
    try {
      if (!streamRef.current) {
        setError('Camera stream not available. Please restart the assessment.');
        return;
      }
      
      // Increment attempt counter
      setAttemptCount(prev => prev + 1);
      
      // Clear previous recording data
      chunksRef.current = [];
      
      // Use higher quality recording settings if supported
      let options = { mimeType: 'video/webm' };
      
      // Try higher quality codecs if supported
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options = { 
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 2500000
        };
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        options = { 
          mimeType: 'video/webm;codecs=vp8',
          videoBitsPerSecond: 2000000
        };
      }
      
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: options.mimeType || 'video/webm' });
          
          // Validate blob size to ensure we captured data
          if (blob.size < 100000) { // Less than ~100KB is likely an error
            throw new Error('Recorded video is too small and may be corrupted');
          }
          
          await analyzeVideo(blob);
        } catch (err) {
          console.error('Error analyzing video:', err);
          
          if (attemptCount < maxAttempts) {
            setError(`Analysis attempt ${attemptCount} failed. Please ensure your hand is clearly visible and try again.`);
          } else {
            setError('Multiple recording attempts failed. Please try again with better lighting and clearer hand movements.');
          }
          
          setIsRecording(false);
        }
      };
      
      // Start recording with higher frequency data collection
      mediaRecorder.start(50); // Collect data every 50ms for smoother chunks
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      recordingStartTime.current = Date.now();
      setRecordingProgress(0);
      
      // Update progress more frequently
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - recordingStartTime.current) / 1000;
        const progress = Math.min(100, (elapsed / recordingDuration) * 100);
        setRecordingProgress(progress);
        
        if (elapsed >= recordingDuration) {
          stopRecording();
        }
      }, 50); // Update every 50ms for smoother progress
      
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
    
    // Provide more specific error messages based on error type
    if (error.message && error.message.includes('camera')) {
      setError('Camera access error. Please check permissions and ensure no other app is using your camera.');
    } else if (error.message && error.message.includes('video')) {
      setError('Video recording error. Please try again with better lighting conditions.');
    } else if (error.message && error.message.includes('analysis')) {
      setError('Analysis error. Please ensure your hand is clearly visible in the frame.');
    } else {
      setError('An error occurred during the assessment. Please try again.');
    }
    
    setIsLoading(false);
    stopAssessment();
  };

  const analyzeVideo = async (videoBlob) => {
    try {
      setIsLoading(true);
      
      // Include additional context in the analysis request
      const analysisParams = {
        handPosition: handPosition || 'unknown',
        attemptCount: attemptCount,
        recordingDuration: recordingDuration
      };
      
      const results = await MLService.analyzeTremor(videoBlob, analysisParams);
      
      if (results.success) {
        if (!results.metrics) {
          throw new Error('No metrics received from analysis');
        }
        
        // Check confidence level to determine if results are reliable
        if (results.metrics.confidence && results.metrics.confidence < 0.4 && attemptCount < maxAttempts) {
          setError(`Low confidence in analysis results (${Math.round(results.metrics.confidence * 100)}%). Consider recording again for better accuracy.`);
          setIsLoading(false);
          setIsRecording(false);
          return;
        }
        
        setMetrics(results.metrics);
      } else {
        throw new Error(results.error || 'Failed to analyze tremor');
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
      setIsRecording(false);
    }
  };

  const handleSaveAssessment = async () => {
    if (!metrics) return;
    
    try {
      setSaveStatus({ saving: true, error: null, success: false });
      
      const assessmentData = {
        userId,
        type: 'tremor',
        timestamp: new Date().toISOString(),
        metrics: metrics,
        metadata: {
          handPosition: handPosition || 'unknown',
          attemptCount: attemptCount,
          recordingDuration: recordingDuration
        }
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
    setHandPosition(null);
  };

  // Enhanced metric card component with additional data support
  const TremorMetricCard = ({ title, value, icon, description, severity, additionalInfo }) => {
    const getSeverityColor = (severity) => {
      switch (severity?.toLowerCase()) {
        case 'mild': return 'success';
        case 'moderate': return 'warning';
        case 'severe': return 'error';
        case 'very severe': return 'error';
        case 'none': return 'info';
        default: return 'primary';
      }
    };

    // Enhanced value formatting
    const formattedValue = () => {
      if (typeof value === 'number') {
        // For frequency, show 2 decimal places
        if (title === 'Frequency') {
          return value.toFixed(2) + ' Hz';
        }
        // For amplitude, show as integer with scale
        if (title === 'Amplitude') {
          return Math.round(value) + '/80';
        }
        // For confidence, show as percentage
        if (title === 'Confidence') {
          return (value * 100).toFixed(0) + '%';
        }
        // For regularity and stability, show as percentage
        if (title === 'Regularity' || title === 'Stability') {
          return (value * 100).toFixed(0) + '%';
        }
        return value.toFixed(2);
      }
      return value;
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
            {formattedValue()}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {description}
          </Typography>
          {severity && (
            <Chip 
              label={severity}
              color={getSeverityColor(severity)}
              size="small"
              sx={{ width: '100%', mb: additionalInfo ? 1 : 0 }}
            />
          )}
          {additionalInfo && (
            <Typography variant="caption" color="text.secondary" display="block" mt={1} sx={{ fontSize: '0.7rem' }}>
              {additionalInfo}
            </Typography>
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
        description="This assessment will analyze hand tremors and movement patterns. You'll be asked to hold your hand in different positions to evaluate for different types of tremor."
        isLoading={isLoading}
        isAssessing={isAssessing}
        error={error}
        onStart={startAssessment}
        onStop={stopAssessment}
        metrics={metrics}
      >
        <Box sx={{ width: '100%', maxWidth: 640, mx: 'auto' }}>
          {/* Video Display */}
          <Box sx={{ 
            aspectRatio: '4/3', 
            bgcolor: 'black', 
            borderRadius: 2, 
            overflow: 'hidden',
            position: 'relative' 
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            
            {/* Hand Position Indicator */}
            {handPosition && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 10, 
                  left: 10, 
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <PanToolIcon fontSize="small" />
                <Typography variant="caption" fontWeight="medium">
                  {handPosition === 'resting' ? 'Resting Position' : 
                   handPosition === 'extended' ? 'Extended Position' : 
                   handPosition === 'action' ? 'Action Movement' : 'Hand Position'}
                </Typography>
              </Box>
            )}
            
            {/* Recording Indicator */}
            {isRecording && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 10, 
                  right: 10, 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box 
                  sx={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    bgcolor: 'error.main',
                    animation: 'pulse 1.5s infinite'
                  }} 
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'white', 
                    bgcolor: 'rgba(0,0,0,0.6)', 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: 1 
                  }}
                >
                  Recording
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Hand Position Selection */}
          {isAssessing && !isRecording && !metrics && handPosition === null && (
            <Box sx={{ mt: 2, textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Select Hand Position
              </Typography>
              
              <Typography variant="body1" mb={3} color="text.secondary">
                Choose the type of assessment you want to perform:
              </Typography>
              
              <Grid container spacing={2} mb={2}>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => selectHandPosition('resting')}
                    sx={{ 
                      p: 2, 
                      height: '100%',
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 1
                    }}
                  >
                    <PanToolIcon color="primary" fontSize="large" />
                    <Typography fontWeight="bold">Resting Tremor</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Hand relaxed and supported
                    </Typography>
                  </Button>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => selectHandPosition('extended')}
                    sx={{ 
                      p: 2, 
                      height: '100%',
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 1
                    }}
                  >
                    <PanToolIcon color="primary" fontSize="large" sx={{ transform: 'rotate(90deg)' }} />
                    <Typography fontWeight="bold">Postural Tremor</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Arms extended forward
                    </Typography>
                  </Button>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => selectHandPosition('action')}
                    sx={{ 
                      p: 2, 
                      height: '100%',
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 1
                    }}
                  >
                    <PanToolIcon color="primary" fontSize="large" />
                    <Typography fontWeight="bold">Action Tremor</Typography>
                    <Typography variant="caption" color="text.secondary">
                      While performing movement
                    </Typography>
                  </Button>
                </Grid>
              </Grid>
              
              {/* Skip option */}
              <Button variant="text" onClick={() => selectHandPosition('standard')}>
                Skip selection and use standard assessment
              </Button>
            </Box>
          )}
          
          {/* Assessment Instructions */}
          {isAssessing && !isRecording && !metrics && handPosition && (
            <Box sx={{ mt: 2, textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Tremor Assessment Instructions
              </Typography>
              
              <Typography variant="body1" gutterBottom fontWeight="medium">
                {handPosition === 'resting' ? 'Rest your hand naturally' : 
                 handPosition === 'extended' ? 'Extend your hand straight ahead' : 
                 handPosition === 'action' ? 'Move your fingers naturally' :
                 'Position your hand clearly in front of the camera'}
              </Typography>
              
              <Box sx={{ mt: 2, mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {handPosition === 'resting' && (
                  <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid #4caf50' }}>
                    <Typography variant="body2" gutterBottom fontWeight="bold">
                      For resting tremor assessment:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rest your hand on your lap or on a surface, keeping it relaxed. Resting tremors occur when muscles are at rest.
                    </Typography>
                  </Paper>
                )}
                
                {handPosition === 'extended' && (
                  <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid #ff9800' }}>
                    <Typography variant="body2" gutterBottom fontWeight="bold">
                      For postural tremor assessment:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Extend your arm in front of you. Hold this position throughout the recording. Postural tremors occur when maintaining a position against gravity.
                    </Typography>
                  </Paper>
                )}
                
                {handPosition === 'action' && (
                  <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid #e91e63' }}>
                    <Typography variant="body2" gutterBottom fontWeight="bold">
                      For action tremor assessment:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Perform a repetitive finger-to-nose movement or other small hand movements. Action tremors occur during voluntary movements.
                    </Typography>
                  </Paper>
                )}
                
                {handPosition === 'standard' && (
                  <>
                    <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid #4caf50' }}>
                      <Typography variant="body2" gutterBottom fontWeight="bold">
                        For natural tremor assessment:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Try to hold your hand still in front of the camera. Any natural tremors will be detected.
                      </Typography>
                    </Paper>
                    
                    <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid #ff9800' }}>
                      <Typography variant="body2" gutterBottom fontWeight="bold">
                        For intentional tremor simulation:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        1. Shake your hand with small, rapid movements
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        2. Move your index finger in a rhythmic pattern
                      </Typography>
                    </Paper>
                  </>
                )}
                
                <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid #2196f3' }}>
                  <Typography variant="body2" gutterBottom fontWeight="bold">
                    Important tips:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Keep your hand well-lit and clearly visible
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Maintain position until recording completes ({recordingDuration} seconds)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Your fingertips should be clearly visible to the camera
                  </Typography>
                </Paper>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setHandPosition(null)}
                  sx={{ mt: 1 }}
                >
                  Back
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={startRecording}
                  size="large"
                  startIcon={attemptCount > 0 ? <SyncIcon /> : null}
                  sx={{ mt: 1, px: 4, py: 1.5 }}
                >
                  {attemptCount > 0 ? `Record Again (${maxAttempts - attemptCount} attempts left)` : `Start Recording (${recordingDuration} seconds)`}
                </Button>
              </Box>
            </Box>
          )}
          
          {/* Recording Progress */}
          {isRecording && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Recording tremor...</span>
                <span>{Math.round(recordingProgress)}%</span>
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={recordingProgress} 
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          )}
          
          {/* Analysis Results */}
          {metrics && (
            <Fade in>
              <Box sx={{ mt: 3 }}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" color="primary">
                      Tremor Analysis Results
                    </Typography>
                    
                    {metrics.confidence !== undefined && (
                      <Chip 
                        icon={<VerifiedUserIcon />} 
                        label={`${Math.round(metrics.confidence * 100)}% Confidence`}
                        color={metrics.confidence > 0.7 ? 'success' : 
                               metrics.confidence > 0.4 ? 'primary' : 'warning'}
                        variant="outlined"
                      />
                    )}
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <TremorMetricCard
                        title="Frequency"
                        value={metrics.tremor_frequency || 0}
                        icon={<WavesIcon color="primary" />}
                        description={`${metrics.peak_count || 0} peaks detected`}
                        severity={metrics.tremor_type || 'None'}
                        additionalInfo={
                          metrics.tremor_frequency < 2 ? "Very slow tremors may indicate cerebellar disorders" :
                          metrics.tremor_frequency >= 4 && metrics.tremor_frequency <= 7 ? "4-7 Hz is typical of parkinsonian tremor" :
                          metrics.tremor_frequency > 7 && metrics.tremor_frequency <= 12 ? "7-12 Hz is typical of essential tremor" : null
                        }
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <TremorMetricCard
                        title="Amplitude"
                        value={metrics.tremor_amplitude}
                        icon={<TimelineIcon color="primary" />}
                        description="Normalized tremor intensity (0-80)"
                        severity={metrics.severity}
                        additionalInfo={
                          metrics.tremor_amplitude > 40 ? "High amplitude tremors may significantly impact daily activities" : 
                          metrics.tremor_amplitude < 10 ? "Low amplitude tremors may be physiological" : null
                        }
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
                    
                    {/* Additional metrics if available */}
                    {(metrics.regularity !== undefined || metrics.stability !== undefined) && (
                      <>
                        {metrics.regularity !== undefined && (
                          <Grid item xs={12} sm={6}>
                            <TremorMetricCard
                              title="Regularity"
                              value={metrics.regularity}
                              icon={<SyncIcon color="primary" />}
                              description="How consistent the tremor pattern is"
                              additionalInfo="Higher regularity suggests a more rhythmic tremor pattern"
                            />
                          </Grid>
                        )}
                        
                        {metrics.stability !== undefined && (
                          <Grid item xs={12} sm={6}>
                            <TremorMetricCard
                              title="Stability"
                              value={metrics.stability}
                              icon={<SyncIcon color="primary" />}
                              description="How stable the tremor is over time"
                              additionalInfo="Higher stability indicates a more persistent tremor pattern"
                            />
                          </Grid>
                        )}
                      </>
                    )}
                  </Grid>
          
                  {/* Clinical Insight */}
                  {metrics.clinical_insight ? (
                    <Alert 
                      severity="info" 
                      icon={<WarningIcon />}
                      sx={{ mt: 3, borderRadius: 2 }}
                    >
                      <AlertTitle>Clinical Insight</AlertTitle>
                      {metrics.clinical_insight}
                    </Alert>
                  ) : (
                    metrics.tremor_frequency > 4 && (
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
                    )
                  )}

                  {/* Save status display */}
                  {renderSaveStatus()}

                  {/* Action buttons */}
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        setMetrics(null);
                        setHandPosition(null);
                        setAttemptCount(0);
                      }}
                      disabled={saveStatus.saving || saveStatus.success}
                    >
                      New Assessment
                    </Button>
                    
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
          
          {/* Error display */}
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
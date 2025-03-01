import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Alert, 
  Button, 
  CircularProgress, 
  Grid, 
  Divider, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { MLService } from '../../services/mlService';
import ErrorBoundary from '../common/ErrorBoundary';
import { specializedAssessments } from '../../services/api';
import { 
  WaveformVisualizer, 
  PitchGraph, 
  EmotionTimeline,
  EmotionLegend
} from './SpeechVisualization';

const MetricDisplay = ({ label, value, suffix = '%', color = 'primary' }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(Math.max(value, 0), 100)} 
            color={color}
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                borderRadius: 4
              }
            }}
          />
        </Box>
        <Box sx={{ minWidth: 45 }}>
          <Typography variant="body2" color="textSecondary">
            {value.toFixed(1)}{suffix}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const SpeechPatternAssessment = ({ userId, onComplete }) => {
  // Theme and responsive breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [canComplete, setCanComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const [visualizationData, setVisualizationData] = useState({
    waveform: null,
    pitch: null,
    emotion: null
  });

  // Refs
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  // Test phrases
  const testPhrases = [
    "Today is a sunny day outside",
    "I enjoy listening to music in my free time",
    "Please count from one to ten slowly"
  ];

// Add after state declarations and before useEffect
const processWaveformData = (rawData, points) => {
  const blockSize = Math.floor(rawData.length / points);
  const filteredData = [];
  
  for (let i = 0; i < points; i++) {
    const blockStart = blockSize * i;
    const block = rawData.slice(blockStart, blockStart + blockSize);
    // Calculate RMS value for this block
    const rms = Math.sqrt(block.reduce((sum, x) => sum + x * x, 0) / block.length);
    filteredData.push(rms);
  }
  
  // Normalize the data
  const maxValue = Math.max(...filteredData);
  return filteredData.map(x => x / (maxValue || 1));
};

const convertToWav = async (audioBuffer) => {
  const numOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChannels * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  
  // Write WAV header
  writeUTFBytes(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeUTFBytes(view, 8, 'WAVE');
  writeUTFBytes(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numOfChannels, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * 2, true);
  view.setUint16(32, numOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeUTFBytes(view, 36, 'data');
  view.setUint32(40, length, true);

  // Write audio data
  const channelData = audioBuffer.getChannelData(0);
  floatTo16BitPCM(view, 44, channelData);

  return new Blob([buffer], { type: 'audio/wav' });
};

const writeUTFBytes = (view, offset, string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const floatTo16BitPCM = (view, offset, input) => {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
};

  useEffect(() => {
    // Check browser support
    if (!navigator.mediaDevices?.getUserMedia) {
      setBrowserSupported(false);
      setError('Your browser does not support audio recording');
    }

    return () => {
      // Cleanup
      stopRecording();
    };
  }, []);

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const startAssessment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;
      const audioChunks = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          setIsAnalyzing(true);
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          
          // Convert audio to wav format before sending
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const audioData = await audioBlob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(audioData);
          
          // Create visualization data from audioBuffer
          const rawData = audioBuffer.getChannelData(0);
          const dataPoints = isMobile ? 50 : 100; // Fewer points for mobile devices
          const waveformData = processWaveformData(rawData, dataPoints);
          
          // Create WAV file
          const wavBlob = await convertToWav(audioBuffer);
          const results = await MLService.analyzeSpeechPattern(wavBlob);
          
          if (results.success) {
            setMetrics({
              ...results.metrics,
              timeSeries: {
                waveform: waveformData,
                pitch: results.metrics.timeSeries?.pitch || [],
                timestamps: Array.from(
                  { length: waveformData.length }, 
                  (_, i) => i * (audioBuffer.duration / waveformData.length)
                ),
                confidence: results.metrics.timeSeries?.confidence || [],
                stress: results.metrics.timeSeries?.stress || [],
                hesitation: results.metrics.timeSeries?.hesitation || []
              }
            });
            setCanComplete(true);
            setRetryCount(0);
          } else {
            throw new Error(results.error || 'Analysis failed');
          }
        } catch (err) {
          handleError(err);
        } finally {
          setIsAnalyzing(false);
        }
      };

      mediaRecorder.start(100);
      setIsAssessing(true);

      // Set timer
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback data generator for visualizations
  const generateFallbackData = (length, type) => {
    switch (type) {
      case 'pitch':
        // Generate a reasonable pitch curve (80-250 Hz range)
        const pitch = [];
        let value = 150 + Math.random() * 50;
        
        for (let i = 0; i < length; i++) {
          value += (Math.random() - 0.5) * 20;
          value = Math.max(80, Math.min(250, value));
          pitch.push(value);
        }
        return pitch;
        
      case 'confidence':
        // Higher values (0.6-1.0)
        return Array.from({ length }, () => 0.6 + Math.random() * 0.4);
        
      case 'stress':
        // Medium values (0.2-0.6)
        return Array.from({ length }, () => 0.2 + Math.random() * 0.4);
        
      case 'hesitation':
        // Lower values (0.1-0.5)
        return Array.from({ length }, () => 0.1 + Math.random() * 0.4);
        
      default:
        return Array.from({ length }, () => Math.random());
    }
  };

  const handleCompleteAssessment = async () => {
    try {
      setIsLoading(true);
      
      // Format metrics to match the expected schema structure
      const formattedMetrics = {
        clarity: typeof metrics.clarity === 'number' 
          ? { score: metrics.clarity * 100 } 
          : metrics.clarity,
        speechRate: {
          wordsPerMinute: metrics.speech_rate || 0
        },
        volumeControl: {
          score: (metrics.volume_control || 0) * 100,
        },
        emotion: {
          confidence: metrics.emotion?.confidence || 0,
          hesitation: metrics.emotion?.hesitation || 0,
          stress: metrics.emotion?.stress || 0,
          monotony: metrics.emotion?.monotony || 0
        },
        // Add other metrics as needed
        overallScore: metrics.overall_score || 
        ((metrics.clarity * 100) + 
         (metrics.volume_control * 100) + 
         ((1 - metrics.emotion.hesitation) * 100)) / 3
      };

      // Prepare assessment data
      const assessmentData = {
        userId,
        timestamp: new Date(),
        metrics: formattedMetrics,
        type: 'speechPattern',
        status: 'COMPLETED'
      };

      // Use the specializedAssessments API instead of direct fetch
      const response = await specializedAssessments.speechPattern.save(assessmentData);

      if (response.data.success) {
        setAssessmentComplete(true);
        if (onComplete) {
          onComplete(assessmentData);
        }
      } else {
        throw new Error(response.data.error || 'Failed to save assessment');
      }

    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (error) => {
    console.error('Speech assessment error:', error);
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      setError(`Analysis failed, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
      startAssessment();
    } else {
      setError(error.message || 'An error occurred during the assessment');
      setIsAssessing(false);
      stopRecording();
    }
  };

  if (!browserSupported) {
    return (
      <Alert severity="error">
        Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 1 : 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Typography variant="h6" gutterBottom>
            Speech Pattern Assessment
          </Typography>
          <Typography variant="body1" gutterBottom>
            Please read the following phrase:
          </Typography>
          <Typography 
            variant={isMobile ? "body1" : "h5"} 
            color="primary" 
            gutterBottom
            sx={{ 
              p: 2, 
              backgroundColor: `${theme.palette.background.default}80`, 
              borderRadius: 1,
              fontWeight: 'medium'
            }}
          >
            {testPhrases[currentPhrase]}
          </Typography>
          
          {!isAssessing && !assessmentComplete && (
            <Button 
              variant="contained" 
              onClick={startAssessment}
              disabled={isLoading}
              fullWidth={isMobile}
              sx={{ mt: 2 }}
            >
              {isLoading ? 'Preparing...' : 'Start Assessment'}
            </Button>
          )}

          {isAssessing && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: isMobile ? 'column' : 'row',
              mt: 2 
            }}>
              <CircularProgress 
                variant="determinate" 
                value={(1 - timeRemaining/10) * 100} 
                size={40} 
                sx={{ mb: isMobile ? 1 : 0, mr: isMobile ? 0 : 2 }}
              />
              <Typography variant={isMobile ? "body1" : "h6"} color="primary">
                Time Remaining: {timeRemaining}s
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {isAnalyzing && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexDirection: 'column',
            p: isMobile ? 2 : 3
          }}>
            <CircularProgress size={isMobile ? 30 : 40} sx={{ mb: 2 }} />
            <Typography variant={isMobile ? "body1" : "h6"}>
              Analyzing speech patterns...
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Generating visualizations
            </Typography>
          </CardContent>
        </Card>
      )}

      {metrics && !isAnalyzing && !assessmentComplete && (
        <Card>
          <CardContent sx={{ p: isMobile ? 1 : 2 }}>
            <Typography variant="h6" gutterBottom>Speech Analysis Results</Typography>
            
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Basic Metrics</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={isMobile ? 1 : 2}>
                  <Grid item xs={12} md={4}>
                    <MetricDisplay 
                      label="Overall Clarity" 
                      value={metrics.clarity * 100} 
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <MetricDisplay 
                      label="Speech Rate" 
                      value={metrics.speech_rate} 
                      suffix=" wpm"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <MetricDisplay 
                      label="Volume Control" 
                      value={metrics.volume_control * 100} 
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Articulation Details</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={isMobile ? 1 : 2}>
                  <Grid item xs={12} sm={6}>
                    <MetricDisplay 
                      label="Precision" 
                      value={metrics.articulation?.precision * 100 || 0} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MetricDisplay 
                      label="Vowel Formation" 
                      value={metrics.articulation?.vowel_formation * 100 || 0} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MetricDisplay 
                      label="Consonant Precision" 
                      value={metrics.articulation?.consonant_precision * 100 || 0} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MetricDisplay 
                      label="Speech Clarity" 
                      value={(1 - (metrics.articulation?.slurred_speech || 0)) * 100} 
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Emotional Indicators</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={isMobile ? 1 : 2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <MetricDisplay 
                      label="Confidence" 
                      value={metrics.emotion.confidence * 100} 
                      color="success"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <MetricDisplay 
                      label="Hesitation" 
                      value={metrics.emotion.hesitation * 100} 
                      color="warning"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <MetricDisplay 
                      label="Stress Level" 
                      value={metrics.emotion.stress * 100} 
                      color="error"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {metrics.neurological_indicators && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Speech Pattern Analysis</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={isMobile ? 1 : 2}>
                    <Grid item xs={12} sm={6}>
                      <MetricDisplay 
                        label="Fluency Score" 
                        value={metrics.fluency.fluency_score * 100} 
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <MetricDisplay 
                        label="Pitch Stability" 
                        value={metrics.pitch_stability * 100} 
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 2, 
                        mt: 1,
                        justifyContent: isMobile ? 'flex-start' : 'space-around'
                      }}>
                        <Typography variant="body2" color="textSecondary">
                          Words per Minute: {metrics.fluency.words_per_minute.toFixed(1)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Pause Rate: {metrics.fluency.pause_rate.toFixed(2)} pauses/sec
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Speech Visualizations</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={isMobile ? 2 : 3}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Waveform
                    </Typography>
                    <WaveformVisualizer 
                      audioData={metrics.timeSeries?.waveform || []} 
                      height={isMobile ? 80 : 100} 
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Pitch Pattern
                    </Typography>
                    <PitchGraph
                      data={metrics.timeSeries?.pitch || []}
                      labels={metrics.timeSeries?.timestamps || []}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Emotional Indicators
                    </Typography>
                    {isMobile && <EmotionLegend />}
                    <EmotionTimeline
                      emotionData={{
                        timestamps: metrics.timeSeries?.timestamps || [],
                        confidence: metrics.timeSeries?.confidence || [],
                        stress: metrics.timeSeries?.stress || [],
                        hesitation: metrics.timeSeries?.hesitation || []
                      }}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {canComplete && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCompleteAssessment}
                  disabled={isLoading}
                  fullWidth={isMobile}
                  size={isMobile ? "large" : "medium"}
                >
                  {isLoading ? 'Saving...' : 'Complete Assessment'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {assessmentComplete && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Assessment completed and saved successfully!
        </Alert>
      )}
    </Box>
  );
}
  export default SpeechPatternAssessment;
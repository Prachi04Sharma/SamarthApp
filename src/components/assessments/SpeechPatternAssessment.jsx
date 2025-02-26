import { useState, useEffect } from 'react';
import { Box, Typography, Button, LinearProgress, Alert, Card, CardContent, Grid, Tooltip, CircularProgress, Paper } from '@mui/material';
import { Mic as MicIcon, VolumeUp as VolumeIcon, Speed as SpeedIcon, Psychology as ClarityIcon, Timer as DurationIcon } from '@mui/icons-material';
import AssessmentLayout from '../common/AssessmentLayout';
import { analyzeSpeech, startRealtimeAnalysis } from '../../services/mlService';
import { assessmentService } from '../../services/assessmentService';
import { WaveformVisualizer, PitchGraph, EmotionTimeline } from './SpeechVisualization';

const MetricCard = ({ title, value, icon, description }) => (
  <Tooltip title={description}>
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" color="primary">
          {value}
        </Typography>
      </CardContent>
    </Card>
  </Tooltip>
);

const SpeechPatternAssessment = ({ userId, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [detailedMetrics, setDetailedMetrics] = useState(null);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [realtimeData, setRealtimeData] = useState({
    audioData: new Uint8Array(0),
    metrics: null,
    emotionData: null
  });

  const testPhrases = [
    "The quick brown fox jumps over the lazy dog",
    "She sells seashells by the seashore",
    "Peter Piper picked a peck of pickled peppers"
  ];

  useEffect(() => {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setBrowserSupported(false);
      setError('Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.');
    }
  }, []);

  const handleRealtimeUpdate = (data) => {
    setRealtimeData(data);
  };

  const startAssessment = async () => {
    try {
      setIsAssessing(true);
      setError(null);
      setMetrics(null);
      setDetailedMetrics(null);

      // Start real-time analysis
      const analysis = await startRealtimeAnalysis(handleRealtimeUpdate);
      
      const results = await analyzeSpeech();
      
      setMetrics(results.metrics);
      setDetailedMetrics(results.rawData);
      
      await assessmentService.saveAssessment(userId, 'SPEECH_PATTERN', {
        ...results.metrics,
        transcript: results.transcript,
        timestamp: new Date().toISOString()
      });

      if (currentPhrase < testPhrases.length - 1) {
        setCurrentPhrase(prev => prev + 1);
      } else {
        onComplete?.(results.metrics);
      }

      // Clean up real-time analysis
      analysis.stop();
    } catch (err) {
      handleAssessmentError(err);
    } finally {
      setIsAssessing(false);
    }
  };

  const handleAssessmentError = (error) => {
    let errorMessage = error.message;
    let severity = 'error';

    if (error.code === 'BROWSER_NOT_SUPPORTED') {
      severity = 'warning';
      setBrowserSupported(false);
    }

    setError(errorMessage);
    setIsAssessing(false);
  };

  const renderMetrics = () => {
    if (!metrics) return null;

    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Clarity"
            value={`${metrics.clarity}%`}
            icon={<ClarityIcon color="primary" />}
            description="Speech clarity score based on pronunciation and confidence"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Speech Rate"
            value={`${metrics.speechRate} WPM`}
            icon={<SpeedIcon color="primary" />}
            description="Words per minute"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Volume Control"
            value={`${metrics.volumeControl}%`}
            icon={<VolumeIcon color="primary" />}
            description="Consistency in volume level"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Duration"
            value={`${metrics.duration}s`}
            icon={<DurationIcon color="primary" />}
            description="Assessment duration"
          />
        </Grid>
      </Grid>
    );
  };

  const renderVisualizations = () => {
    if (!realtimeData.audioData.length) return null;

    return (
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Live Waveform
              </Typography>
              <WaveformVisualizer audioData={realtimeData.audioData} />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Pitch Analysis
              </Typography>
              <PitchGraph 
                data={realtimeData.metrics?.pitchData || []}
                labels={realtimeData.emotionData?.timestamps || []}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Emotional Analysis
              </Typography>
              <EmotionTimeline emotionData={realtimeData.emotionData} />
            </Paper>
          </Grid>
        </Grid>

        {realtimeData.metrics && (
          <Paper sx={{ p: 2, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Real-time Feedback
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="primary">
                  Volume Level: {Math.round(realtimeData.metrics.volume)} dB
                </Typography>
                {realtimeData.metrics.volume < -50 && (
                  <Typography variant="caption" color="error">
                    Speak a bit louder
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="primary">
                  Speech Clarity: {Math.round(realtimeData.metrics.clarity * 100)}%
                </Typography>
                {realtimeData.metrics.clarity < 0.7 && (
                  <Typography variant="caption" color="error">
                    Try to speak more clearly
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="primary">
                  Emotional State: {getEmotionalState(realtimeData.metrics.emotion)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>
    );
  };

  const getEmotionalState = (emotion) => {
    if (!emotion) return 'Analyzing...';
    
    if (emotion.confidence > 0.7) return 'Confident';
    if (emotion.stress > 0.7) return 'Stressed';
    if (emotion.hesitation > 0.7) return 'Hesitant';
    return 'Neutral';
  };

  return (
    <AssessmentLayout
      title="Speech Pattern Assessment"
      description={
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body1" component="div">
            This assessment will analyze your speech patterns. Please read the phrase below clearly and at your natural pace.
          </Typography>
          
          {!browserSupported && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Your browser does not support speech recognition. Please use Chrome, Edge, or Safari for best results.
            </Alert>
          )}

          {browserSupported && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Please speak in a quiet environment and ensure your microphone is working properly.
            </Alert>
          )}

          <Typography variant="h6" component="div" sx={{ 
            textAlign: 'center', 
            color: 'primary.main',
            p: 2,
            border: 1,
            borderColor: 'primary.main',
            borderRadius: 1,
            mt: 2,
            bgcolor: 'background.paper'
          }}>
            "{testPhrases[currentPhrase]}"
          </Typography>
          
          <Typography variant="caption" color="text.secondary" align="center">
            Phrase {currentPhrase + 1} of {testPhrases.length}
          </Typography>
        </Box>
      }
      isLoading={isLoading}
      isAssessing={isAssessing}
      error={error}
      metrics={metrics}
    >
      <Box sx={{ width: '100%', maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {isAssessing && (
          <Box sx={{ width: '100%' }}>
            <LinearProgress color="primary" />
            <Typography variant="caption" sx={{ mt: 1 }}>
              Listening... (automatically stops after 10 seconds)
            </Typography>
          </Box>
        )}

        <Button
          variant="contained"
          color="primary"
          startIcon={isAssessing ? <CircularProgress size={20} color="inherit" /> : <MicIcon />}
          onClick={startAssessment}
          disabled={isAssessing || !browserSupported}
          sx={{ alignSelf: 'center', minWidth: 200 }}
        >
          {isAssessing ? 'Listening...' : 'Start Speaking'}
        </Button>

        {renderMetrics()}

        {detailedMetrics && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Detailed Analysis
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Emotional Markers
                    </Typography>
                    <Typography variant="body2">
                      Confidence: {metrics.emotionalMarkers.confidence} instances
                    </Typography>
                    <Typography variant="body2">
                      Hesitation: {metrics.emotionalMarkers.hesitation} instances
                    </Typography>
                    <Typography variant="body2">
                      Stress: {metrics.emotionalMarkers.stress} instances
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Speech Patterns
                    </Typography>
                    <Typography variant="body2">
                      Stuttering: {metrics.stuttering}
                    </Typography>
                    <Typography variant="body2">
                      Pitch Variation: {metrics.pitchVariation}
                    </Typography>
                    <Typography variant="body2">
                      Overall Score: {metrics.overallScore}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {isAssessing && renderVisualizations()}
      </Box>
    </AssessmentLayout>
  );
};

export default SpeechPatternAssessment; 
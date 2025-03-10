import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardActions, 
  Typography, 
  IconButton, 
  Collapse,
  Box,
  Chip,
  Grid,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

const AssessmentCard = ({ assessment, onViewDetails }) => {
  const [expanded, setExpanded] = useState(false);
  const [processedAssessment, setProcessedAssessment] = useState(null);

  // Process assessment data when the component receives it
  useEffect(() => {
    if (assessment) {
      console.log('AssessmentCard received assessment:', assessment);
      
      // Create a deep copy to avoid mutation issues
      const processed = JSON.parse(JSON.stringify(assessment));
      
      // Ensure metrics object exists
      if (!processed.metrics) {
        processed.metrics = {};
        console.warn('Assessment missing metrics object, creating empty one');
      }
      
      // For backwards compatibility, copy data to metrics if metrics is empty
      if (processed.data && Object.keys(processed.metrics).length === 0) {
        console.log('Copying data to metrics for consistency');
        processed.metrics = { ...processed.data };
      }
      
      // Normalize assessment structure based on type
      switch (processed.type) {
        case 'tremor':
          if (!processed.metrics.severity && processed.metrics.overallScore) {
            processed.metrics.severity = processed.metrics.overallScore;
          }
          break;
        case 'speechPattern':
          if (!processed.metrics.overallScore && processed.metrics.overallQuality) {
            processed.metrics.overallScore = processed.metrics.overallQuality;
          }
          break;
        case 'responseTime':
          // Ensure all expected fields exist
          processed.metrics.completedRounds = processed.metrics.completedRounds || 0;
          processed.metrics.totalRounds = processed.metrics.totalRounds || 0;
          break;
        // Add more normalizations for other assessment types as needed
      }
      
      console.log('Processed assessment for card display:', processed);
      setProcessedAssessment(processed);
    }
  }, [assessment]);

  // Return null if assessment data isn't loaded yet
  if (!processedAssessment) return null;

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  // Format date
  const formattedDate = new Date(processedAssessment.timestamp).toLocaleDateString();
  const formattedTime = new Date(processedAssessment.timestamp).toLocaleTimeString();

  // Get the display name based on assessment type
  const getDisplayName = () => {
    const typeMap = {
      'tremor': 'Tremor Assessment',
      'speechPattern': 'Speech Pattern Assessment',
      'responseTime': 'Response Time Assessment',
      'neckMobility': 'Neck Mobility Assessment',
      'gaitAnalysis': 'Gait Analysis Assessment',
      'fingerTapping': 'Finger Tapping Assessment',
      'facialSymmetry': 'Facial Symmetry Assessment',
      'eyeMovement': 'Eye Movement Assessment'
    };
    
    return typeMap[processedAssessment.type] || processedAssessment.type;
  };

  // Get primary metric to display based on type
  const getPrimaryMetric = () => {
    switch(processedAssessment.type) {
      case 'tremor':
        return {
          label: 'Severity',
          value: processedAssessment.metrics.severity || 'N/A'
        };
      case 'speechPattern': {
        // Get the overall score from any of these possible locations
        const overallScore = 
          processedAssessment.metrics.overallScore || 
          processedAssessment.metrics.overall?.compositeScore ||
          (processedAssessment.metrics.clarity?.score ? 
            processedAssessment.metrics.clarity.score : 0);
        
        return {
          label: 'Overall Score',
          value: `${overallScore}/100`
        };
      }
      case 'responseTime':
        return {
          label: 'Avg. Response Time',
          value: processedAssessment.metrics.averageResponseTime || 'N/A'
        };
      case 'neckMobility':
        return {
          label: 'Mobility Score',
          value: `${processedAssessment.metrics.overall?.mobilityScore || 0}/100`
        };
      case 'gaitAnalysis':
        return {
          label: 'Stability Score',
          value: `${processedAssessment.metrics.overall?.stabilityScore || 0}/100`
        };
      case 'fingerTapping':
        return {
          label: 'Overall Score',
          value: `${processedAssessment.metrics.overallScore || 0}/100`
        };
      case 'facialSymmetry': {
        // Check multiple possible locations for symmetry score
        const symmetryScore = 
          processedAssessment.symmetry_score || 
          processedAssessment.metrics.symmetryScore || 
          processedAssessment.metrics.symmetry_score || 
          0;
        return {
          label: 'Symmetry Score',
          value: `${symmetryScore}/1000`
        };
      }
      case 'eyeMovement':
        return {
          label: 'Composite Score',
          value: `${processedAssessment.metrics.overall?.compositeScore || 0}/100`
        };
      default:
        return {
          label: 'Score',
          value: 'N/A'
        };
    }
  };

  // Get secondary metrics based on type
  const getSecondaryMetrics = () => {
    switch(processedAssessment.type) {
      case 'tremor': {
        // Handle possible variations in field names
        const tremor_frequency = processedAssessment.metrics.tremor_frequency || 
                                processedAssessment.metrics.frequency || 0;
        const tremor_amplitude = processedAssessment.metrics.tremor_amplitude || 
                                processedAssessment.metrics.amplitude || 0;
        const tremor_type = processedAssessment.metrics.tremor_type || 
                           processedAssessment.metrics.type || 'N/A';
                           
        return [
          { label: 'Frequency', value: `${tremor_frequency} Hz` },
          { label: 'Amplitude', value: tremor_amplitude },
          { label: 'Type', value: tremor_type }
        ];
      }
      case 'speechPattern': {
        // Extract metrics, handling possible variations in data structure
        const clarityScore = typeof processedAssessment.metrics.clarity === 'object' ? 
                           processedAssessment.metrics.clarity.score : 
                           processedAssessment.metrics.clarity || 0;
                           
        const wordsPerMinute = processedAssessment.metrics.speechRate?.wordsPerMinute || 
                             processedAssessment.metrics.words_per_minute || 
                             processedAssessment.metrics.speech_rate || 0;
                             
        const volumeScore = typeof processedAssessment.metrics.volumeControl === 'object' ?
                          processedAssessment.metrics.volumeControl.score :
                          processedAssessment.metrics.volumeControl || 
                          processedAssessment.metrics.volume_control || 
                          processedAssessment.metrics.volume || 0;
                  
        return [
          { label: 'Clarity', value: `${clarityScore}/100` },
          { label: 'Speech Rate', value: `${wordsPerMinute} WPM` },
          { label: 'Volume Control', value: `${volumeScore}/100` }
        ];
      }
      case 'responseTime':
        return [
          { label: 'Fastest', value: processedAssessment.metrics.fastestResponse || 'N/A' },
          { label: 'Slowest', value: processedAssessment.metrics.slowestResponse || 'N/A' },
          { label: 'Completed', value: `${processedAssessment.metrics.completedRounds || 0}/${processedAssessment.metrics.totalRounds || 0}` }
        ];
      case 'neckMobility': {
        const flexion = processedAssessment.metrics.flexion?.degrees || 
                      processedAssessment.metrics.flexion || 0;
        const extension = processedAssessment.metrics.extension?.degrees || 
                        processedAssessment.metrics.extension || 0;
        const leftRotation = processedAssessment.metrics.rotation?.left?.degrees || 
                           processedAssessment.metrics.left_rotation || 0;
        const rightRotation = processedAssessment.metrics.rotation?.right?.degrees || 
                            processedAssessment.metrics.right_rotation || 0;
        
        return [
          { label: 'Flexion', value: `${flexion}°` },
          { label: 'Extension', value: `${extension}°` },
          { label: 'Left Rotation', value: `${leftRotation}°` },
          { label: 'Right Rotation', value: `${rightRotation}°` }
        ];
      }
      case 'gaitAnalysis': {
        const stability = processedAssessment.metrics.stability?.score || 
                        processedAssessment.metrics.stability || 0;
        const balance = processedAssessment.metrics.balance?.score || 
                      processedAssessment.metrics.balance || 0;
        const symmetry = processedAssessment.metrics.symmetry?.overall || 
                       processedAssessment.metrics.symmetry || 0;
        
        return [
          { label: 'Stability', value: `${stability}/1000` },
          { label: 'Balance', value: `${balance}/1000` },
          { label: 'Symmetry', value: `${symmetry}/1000` }
        ];
      }
      case 'fingerTapping': {
        const frequency = processedAssessment.metrics.frequency || 0;
        const amplitude = processedAssessment.metrics.amplitude || 0;
        const rhythm = processedAssessment.metrics.rhythm || 0;
        const accuracy = processedAssessment.metrics.accuracy || 0;
        
        return [
          { label: 'Frequency', value: `${frequency}/100` },
          { label: 'Amplitude', value: `${amplitude}/100` },
          { label: 'Rhythm', value: `${rhythm}/100` },
          { label: 'Accuracy', value: `${accuracy}/100` }
        ];
      }
      case 'facialSymmetry': {
        const eyeSymmetry = processedAssessment.metrics.eye_symmetry || 
                          processedAssessment.metrics.eyeSymmetry || 0;
        const mouthSymmetry = processedAssessment.metrics.mouth_symmetry || 
                            processedAssessment.metrics.mouthSymmetry || 0;
        const jawSymmetry = processedAssessment.metrics.jaw_symmetry || 
                          processedAssessment.metrics.jawSymmetry || 0;
        
        return [
          { label: 'Eye Symmetry', value: `${eyeSymmetry}/100` },
          { label: 'Mouth Symmetry', value: `${mouthSymmetry}/100` },
          { label: 'Jaw Symmetry', value: `${jawSymmetry}/100` }
        ];
      }
      case 'eyeMovement': {
        const velocityScore = processedAssessment.metrics.overall?.velocityScore || 0;
        const accuracyScore = processedAssessment.metrics.overall?.accuracyScore || 0;
        const smoothnessScore = processedAssessment.metrics.overall?.smoothnessScore || 0;
        
        return [
          { label: 'Velocity', value: `${velocityScore}/100` },
          { label: 'Accuracy', value: `${accuracyScore}/100` },
          { label: 'Smoothness', value: `${smoothnessScore}/100` }
        ];
      }
      default:
        return [];
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch(processedAssessment.status) {
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      case 'IN_PROGRESS': return 'warning';
      default: return 'default';
    }
  };

  const primaryMetric = getPrimaryMetric();
  const secondaryMetrics = getSecondaryMetrics();

  // Pass the processed assessment to the detail view handler
  const handleViewDetails = () => {
    if (onViewDetails && processedAssessment) {
      console.log('Passing processed assessment to dialog:', processedAssessment);
      onViewDetails(processedAssessment);
    }
  };

  return (
    <Card elevation={3} sx={{ 
      borderRadius: 2, 
      transition: '0.3s',
      '&:hover': { 
        boxShadow: 6,
        transform: 'translateY(-3px)'
      },
      position: 'relative',
      overflow: 'visible'
    }}>
      <CardHeader
        title={getDisplayName()}
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {formattedDate} at {formattedTime}
            </Typography>
            <Chip 
              label={processedAssessment.status} 
              color={getStatusColor()} 
              size="small" 
              sx={{ height: 20, fontSize: '0.7rem' }} 
            />
          </Box>
        }
      />
      
      <CardContent sx={{ pt: 0.5 }}>
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {primaryMetric.label}
          </Typography>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            {primaryMetric.value}
          </Typography>
        </Box>
      </CardContent>

      <CardActions disableSpacing sx={{ pt: 0 }}>
        <IconButton 
          aria-label="view details" 
          onClick={handleViewDetails}
          sx={{ 
            color: 'primary.main',
            '&:hover': { backgroundColor: 'primary.50' }
          }}
        >
          <BarChartIcon />
        </IconButton>
        <IconButton
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
          sx={{ 
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: '0.3s',
            ml: 'auto'
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </CardActions>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {secondaryMetrics.map((metric, index) => (
              <Grid item xs={6} key={index}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {metric.label}
                </Typography>
                <Typography variant="body1">{metric.value}</Typography>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default AssessmentCard;
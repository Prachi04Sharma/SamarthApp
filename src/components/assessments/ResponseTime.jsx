import { useState, useRef } from 'react';
import { Box, Paper } from '@mui/material';
import AssessmentLayout from '../common/AssessmentLayout';
import { assessmentService, assessmentTypes } from '../../services/assessmentService';

const ResponseTime = ({ userId, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [showStimulus, setShowStimulus] = useState(false);
  const [responses, setResponses] = useState([]);
  const [round, setRound] = useState(0);
  const stimulusStartTime = useRef(null);
  const assessmentStartTime = useRef(null);
  const timeoutRef = useRef(null);
  const totalRounds = 5;

  const startAssessment = () => {
    setIsAssessing(true);
    setError(null);
    setResponses([]);
    setRound(0);
    setShowStimulus(false);
    assessmentStartTime.current = Date.now();
    scheduleNextStimulus();
  };

  const scheduleNextStimulus = () => {
    // Random delay between 1-3 seconds
    const delay = Math.random() * 2000 + 1000;
    timeoutRef.current = setTimeout(() => {
      stimulusStartTime.current = Date.now();
      setShowStimulus(true);
    }, delay);
  };

  const handleResponse = () => {
    if (!showStimulus) {
      // Early response - penalize
      setError('Too early! Wait for the green color.');
      return;
    }

    const responseTime = Date.now() - stimulusStartTime.current;
    const newResponses = [...responses, responseTime];
    setResponses(newResponses);
    setShowStimulus(false);
    setRound(prev => prev + 1);

    // Calculate and update metrics
    const currentMetrics = calculateMetrics(newResponses);
    setMetrics(currentMetrics);

    if (round + 1 >= totalRounds) {
      stopAssessment(newResponses);
    } else {
      scheduleNextStimulus();
    }
  };

  const calculateMetrics = (responseData) => {
    if (responseData.length === 0) return null;

    const sortedTimes = [...responseData].sort((a, b) => a - b);
    const averageTime = responseData.reduce((a, b) => a + b, 0) / responseData.length;
    
    return {
      averageResponseTime: averageTime.toFixed(2),
      fastestResponse: sortedTimes[0].toFixed(2),
      slowestResponse: sortedTimes[sortedTimes.length - 1].toFixed(2),
      totalRounds: responseData.length,
      completedRounds: round + 1,
      duration: ((Date.now() - assessmentStartTime.current) / 1000).toFixed(1)
    };
  };

  const stopAssessment = async (finalResponses = responses) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsAssessing(false);
    setShowStimulus(false);

    if (finalResponses.length > 0) {
      const finalMetrics = calculateMetrics(finalResponses);
      setMetrics(finalMetrics);

      try {
        // Save assessment results
        await assessmentService.saveAssessment(
          userId,
          assessmentTypes.RESPONSE_TIME,
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
      title="Response Time Assessment"
      description={`Test your reaction time by clicking as soon as you see the green color appear. You will have ${totalRounds} rounds.`}
      isLoading={isLoading}
      isAssessing={isAssessing}
      error={error}
      onStart={startAssessment}
      onStop={stopAssessment}
      metrics={metrics}
    >
      {isAssessing ? (
        <Paper
          onClick={handleResponse}
          sx={{
            width: '100%',
            maxWidth: 400,
            height: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            bgcolor: showStimulus ? 'success.light' : 'background.paper',
            transition: 'background-color 0.1s ease-out'
          }}
        >
          <Box sx={{ textAlign: 'center', color: 'text.primary' }}>
            {showStimulus ? 'Click Now!' : 'Wait for green...'}
          </Box>
        </Paper>
      ) : (
        <Paper
          sx={{
            width: '100%',
            maxWidth: 400,
            height: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2
          }}
        >
          <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
            Click Start Assessment to begin
          </Box>
        </Paper>
      )}
    </AssessmentLayout>
  );
};

export default ResponseTime; 
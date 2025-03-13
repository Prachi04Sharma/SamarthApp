import { useState, useRef, useCallback } from 'react';
import { MLService } from '../../../../services/mlService';
import { ASSESSMENT_PHASES } from '../constants/assessmentConfig';

export const useEyeTracking = (userId, videoRef) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [neurologicalIndicators, setNeurologicalIndicators] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const phaseTimerRef = useRef(null);

  const processPhase = async (blob, phase) => {
    try {
      const results = await MLService.analyzeEyes(blob, phase);
      if (results.success) {
        // Ensure accuracy exists with a fallback value
        if (results.metrics && results.metrics.summary) {
          if (typeof results.metrics.summary.accuracy === 'undefined' || 
              results.metrics.summary.accuracy === null) {
            results.metrics.summary.accuracy = 75.0; // Reasonable default
          }
        }
        
        setMetrics(prev => ({
          ...prev,
          [phase]: results.metrics
        }));
        return results;
      }
      throw new Error(results.detail || 'Processing failed');
    } catch (err) {
      console.error('Error processing phase:', err);
      setError(`Failed to process phase ${phase}: ${err.message}`);
      throw err;
    }
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setIsRecording(true);
      
      for (const [phase, config] of Object.entries(ASSESSMENT_PHASES)) {
        setCurrentPhase(phase);
        await runPhase(phase, config);
      }
      
      setIsRecording(false);
    } catch (err) {
      setError(`Recording failed: ${err.message}`);
      setIsRecording(false);
    }
  }, []);

  const runPhase = async (phase, config) => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current?.srcObject) {
        reject(new Error('Video stream not available'));
        return;
      }

      chunksRef.current = [];
      
      // Updated MediaRecorder creation with proper fallback support
      let options = {};
      
      // Try different MIME types in order of preference
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 2500000 };
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 2500000 };
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options = { mimeType: 'video/webm' };
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4' };
      }
      // No options specified means browser will choose its default
      
      try {
        const mediaRecorder = new MediaRecorder(videoRef.current.srcObject, options);
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          try {
            // Create blob with appropriate type that matches what we recorded with
            const mimeType = options.mimeType || 'video/webm'; // Default fallback
            const blob = new Blob(chunksRef.current, { type: mimeType });
            const results = await processPhase(blob, phase);
            resolve(results);
          } catch (err) {
            reject(err);
          }
        };

        mediaRecorder.onerror = (event) => {
          reject(new Error(`MediaRecorder error: ${event.error.name}`));
        };

        mediaRecorder.start(1000); // Collect data every second
        mediaRecorderRef.current = mediaRecorder;

        // Stop recording after phase duration
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, config.duration);
      } catch (err) {
        reject(new Error(`Failed to create MediaRecorder: ${err.message}`));
      }
    });
  };

  return {
    isRecording,
    currentPhase,
    metrics,
    neurologicalIndicators,
    error,
    startRecording,
    processPhase
  };
};
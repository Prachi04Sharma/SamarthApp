import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as faceapi from 'face-api.js';
import '@tensorflow/tfjs-backend-webgl';
import { startFingerTapping, stopFingerTapping } from './assessments/fingerTappingService';

// Constants for speech and movement analysis
export const SPEECH_METRICS = {
  FLUENCY_THRESHOLD: 750, // milliseconds
  MIN_VOLUME: -90,
  MAX_VOLUME: -10,
  SAMPLE_RATE: 44100,
  FFT_SIZE: 2048
};

export const MODEL_PATHS = {
  FACE_MODELS: '/models',
  HAND_POSE: '/models/handpose'
};

let modelsLoaded = false;
let modelLoadingPromise = null;
let poseDetector = null;

// Initialize TensorFlow.js with optimized settings
const initTensorFlow = async () => {
  try {
    // Basic initialization
    await tf.ready();
    
    // Set backend to WebGL with basic settings
    await tf.setBackend('webgl');
    
    // Simple WebGL configuration
    tf.env().set('WEBGL_PACK', false);
    tf.env().set('WEBGL_FORCE_F16_TEXTURES', false);
    
    console.log('TensorFlow.js initialized successfully');
    return true;
  } catch (error) {
    console.error('TensorFlow initialization error:', error);
    return false;
  }
};

// Initialize and load models
export const initializeModels = async () => {
  if (modelsLoaded) return;
  
  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }

  try {
    modelLoadingPromise = (async () => {
      // Initialize TensorFlow first
      const tfInitialized = await initTensorFlow();
      if (!tfInitialized) {
        throw new Error('TensorFlow initialization failed');
      }

      try {
        // Basic environment setup
        faceapi.env.monkeyPatch({
          Canvas: HTMLCanvasElement,
          Image: HTMLImageElement,
          ImageData: ImageData,
          Video: HTMLVideoElement,
          createCanvasElement: () => document.createElement('canvas'),
          createImageElement: () => document.createElement('img')
        });

        // Load only essential models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATHS.FACE_MODELS),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATHS.FACE_MODELS)
        ]);

        console.log('Face detection models loaded successfully');
        modelsLoaded = true;
      } catch (error) {
        console.error('Error loading face models:', error);
        throw new Error('Failed to load face detection models');
      }
    })();
    
    await modelLoadingPromise;
    modelLoadingPromise = null;
  } catch (error) {
    modelLoadingPromise = null;
    console.error('Error in model initialization:', error);
    throw error;
  }
};

// Check if models are loaded
export const areModelsLoaded = () => modelsLoaded;

// Calculate jaw symmetry
const calculateJawSymmetry = (jawPoints, midlineX) => {
  let totalAsymmetry = 0;
  const midPoint = Math.floor(jawPoints.length / 2);

  for (let i = 0; i < midPoint; i++) {
    const leftPoint = jawPoints[i];
    const rightPoint = jawPoints[jawPoints.length - 1 - i];
    totalAsymmetry += Math.abs(
      Math.abs(leftPoint.x - midlineX) - Math.abs(rightPoint.x - midlineX)
    );
  }

  return totalAsymmetry / midPoint;
};

// Calculate face angle from landmarks
const calculateFaceAngle = (landmarks) => {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();

  // Calculate roll angle (head tilt)
  const dY = rightEye[0].y - leftEye[0].y;
  const dX = rightEye[0].x - leftEye[0].x;
  const rollAngle = Math.atan2(dY, dX) * (180 / Math.PI);

  // Calculate yaw angle (head turn)
  const eyesMidpoint = {
    x: (leftEye[0].x + rightEye[0].x) / 2,
    y: (leftEye[0].y + rightEye[0].y) / 2
  };
  const nosePoint = nose[0];
  const yawAngle = Math.atan2(nosePoint.x - eyesMidpoint.x, nosePoint.y - eyesMidpoint.y) * (180 / Math.PI);

  return { roll: rollAngle, yaw: yawAngle };
};

// Calculate facial symmetry score
const calculateSymmetryScore = (landmarks) => {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();
  const mouth = landmarks.getMouth();
  const jaw = landmarks.getJawOutline();

  // Calculate midline of face
  const midlineX = (leftEye[0].x + rightEye[0].x) / 2;

  // Calculate symmetry by comparing distances from midline
  const eyeSymmetry = Math.abs(
    Math.abs(leftEye[0].x - midlineX) - Math.abs(rightEye[0].x - midlineX)
  );
  const mouthSymmetry = Math.abs(mouth[0].x - midlineX);
  const jawSymmetry = calculateJawSymmetry(jaw, midlineX);

  // Combine scores (lower is better)
  const totalAsymmetry = eyeSymmetry + mouthSymmetry + jawSymmetry;
  
  // Convert to 0-100 score (higher is better)
  return Math.max(0, 100 - (totalAsymmetry * 10));
};

// Calculate eye movement between frames
const calculateEyeMovement = (currentEye, previousEye) => {
  const currentCenter = {
    x: currentEye.reduce((sum, p) => sum + p.x, 0) / currentEye.length,
    y: currentEye.reduce((sum, p) => sum + p.y, 0) / currentEye.length
  };

  const previousCenter = {
    x: previousEye.reduce((sum, p) => sum + p.x, 0) / previousEye.length,
    y: previousEye.reduce((sum, p) => sum + p.y, 0) / previousEye.length
  };

  return {
    x: currentCenter.x - previousCenter.x,
    y: currentCenter.y - previousCenter.y
  };
};

// Face detection with optimized options
export const detectFaces = async (imageElement) => {
  if (!modelsLoaded) {
    await initializeModels();
  }

  try {
    if (!imageElement || !imageElement.width || !imageElement.height) {
      return [];
    }

    // Simple detection with minimal options
    const detections = await faceapi.detectAllFaces(
      imageElement,
      new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 })
    ).withFaceLandmarks();

    return detections || [];
  } catch (error) {
    console.error('Face detection error:', error);
    return [];
  }
};

// Process facial metrics (simplified)
export const processFacialMetrics = (detection) => {
  if (!detection || !detection.landmarks) return null;

  try {
    const landmarks = detection.landmarks;
    return {
      landmarks: {
        leftEye: landmarks.getLeftEye(),
        rightEye: landmarks.getRightEye(),
        nose: landmarks.getNose(),
        mouth: landmarks.getMouth(),
        jaw: landmarks.getJawOutline()
      }
    };
  } catch (error) {
    console.error('Error processing facial metrics:', error);
    return null;
  }
};

// Optimized eye movement processing
export const processEyeMovement = (currentLandmarks, previousLandmarks) => {
  if (!currentLandmarks || !previousLandmarks) return null;

  try {
    const currentLeftEye = currentLandmarks.getLeftEye();
    const currentRightEye = currentLandmarks.getRightEye();
    const prevLeftEye = previousLandmarks.getLeftEye();
    const prevRightEye = previousLandmarks.getRightEye();

    // Calculate centers using reduce for better performance
    const getCenterPoint = (points) => {
      return points.reduce(
        (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
        { x: 0, y: 0 }
      );
    };

    const currentLeftCenter = getCenterPoint(currentLeftEye);
    const currentRightCenter = getCenterPoint(currentRightEye);
    const prevLeftCenter = getCenterPoint(prevLeftEye);
    const prevRightCenter = getCenterPoint(prevRightEye);

    // Normalize by point count
    const pointCount = currentLeftEye.length;
    currentLeftCenter.x /= pointCount;
    currentLeftCenter.y /= pointCount;
    currentRightCenter.x /= pointCount;
    currentRightCenter.y /= pointCount;
    prevLeftCenter.x /= pointCount;
    prevLeftCenter.y /= pointCount;
    prevRightCenter.x /= pointCount;
    prevRightCenter.y /= pointCount;

    return {
      leftEye: {
        x: currentLeftCenter.x - prevLeftCenter.x,
        y: currentLeftCenter.y - prevLeftCenter.y
      },
      rightEye: {
        x: currentRightCenter.x - prevRightCenter.x,
        y: currentRightCenter.y - prevRightCenter.y
      },
      averageMovement: {
        x: ((currentLeftCenter.x - prevLeftCenter.x) + (currentRightCenter.x - prevRightCenter.x)) / 2,
        y: ((currentLeftCenter.y - prevLeftCenter.y) + (currentRightCenter.y - prevRightCenter.y)) / 2
      }
    };
  } catch (error) {
    console.error('Error processing eye movement:', error);
    return null;
  }
};

// Speech Analysis Implementation
export const analyzeSpeech = () => {
  return new Promise((resolve, reject) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      reject(new Error('Speech recognition is not supported in this browser'));
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    let startTime = Date.now();
    let lastWordTime = startTime;
    let wordCount = 0;
    let transcript = '';

    recognition.onresult = (event) => {
      const currentTime = Date.now();
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript.trim();
      
      if (result.isFinal) {
        transcript += text + ' ';
        const words = text.split(' ').length;
        wordCount += words;
        lastWordTime = currentTime;
      }
    };

    recognition.onend = () => {
      const duration = (lastWordTime - startTime) / 1000; // Convert to seconds
      const wordsPerMinute = wordCount > 0 ? (wordCount / duration) * 60 : 0;

      resolve({
        transcript,
        duration,
        wordsPerMinute,
        wordCount
      });
    };

    recognition.onerror = (event) => {
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition.start();
  });
};

// Initialize TensorFlow
initTensorFlow().catch(console.error);

const ML_SERVICE_URL = 'http://localhost:8000';

export const MLService = {
    /**
     * Analyze facial symmetry
     * @param {Blob} imageBlob - Image blob to analyze
     * @returns {Promise<Object>} Analysis results
     */
    analyzeFace: async function(imageBlob) {
        const formData = new FormData();
        formData.append('file', imageBlob);
        
        try {
            const response = await fetch(`${ML_SERVICE_URL}/analyze/face`, {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error analyzing face:', error);
            throw error;
        }
    },

    /**
     * Analyze eye movement
     * @param {Blob} imageBlob - Image blob to analyze
     * @returns {Promise<Object>} Analysis results
     */
    analyzeEyes: async function(imageBlob) {
        const formData = new FormData();
        formData.append('file', imageBlob);
        
        try {
            const response = await fetch(`${ML_SERVICE_URL}/analyze/eyes`, {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error analyzing eyes:', error);
            throw error;
        }
    },

    /**
     * Analyze hand tremor
     * @param {Blob} videoBlob - Video blob to analyze
     * @returns {Promise<Object>} Analysis results
     */
    analyzeTremor: async function(videoBlob) {
        const formData = new FormData();
        formData.append('file', videoBlob);
        
        try {
            const response = await fetch(`${ML_SERVICE_URL}/analyze/tremor`, {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error analyzing tremor:', error);
            throw error;
        }
    },

    /**
     * Set neutral position for neck mobility assessment
     * @param {Blob} imageBlob - Image blob of neutral position
     * @returns {Promise<Object>} Success status
     */
    async setNeckNeutral(imageBlob) {
        try {
            const formData = new FormData();
            formData.append('frame', imageBlob, 'frame.jpg');

            const response = await fetch(`${ML_SERVICE_URL}/analyze/neck/set-neutral`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error setting neutral position:', error);
            throw error;
        }
    },

    /**
     * Measure specific neck position
     * @param {Blob} imageBlob - Image blob of position
     * @param {string} position - Position type (flexion, extension, rotation)
     * @returns {Promise<Object>} Measurement results
     */
    async measureNeckPosition(imageBlob, position) {
        try {
            const formData = new FormData();
            formData.append('frame', imageBlob, 'frame.jpg');
            formData.append('position', position);

            const response = await fetch(`${ML_SERVICE_URL}/analyze/neck/measure`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error measuring position:', error);
            throw error;
        }
    },

    /**
     * Get complete neck mobility assessment results
     * @returns {Promise<Object>} Assessment results
     */
    async getNeckMobilityResults() {
        try {
            const response = await fetch(`${ML_SERVICE_URL}/analyze/neck/results`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting results:', error);
            throw error;
        }
    }
};

// Export all functions and constants as a service object as well
export const mlService = {
  initializeModels,
  areModelsLoaded,
  detectFaces,
  processFacialMetrics,
  processEyeMovement,
  analyzeSpeech,
  MODEL_PATHS,
  SPEECH_METRICS,
  startFingerTapping,
  stopFingerTapping,
  MLService
}; 
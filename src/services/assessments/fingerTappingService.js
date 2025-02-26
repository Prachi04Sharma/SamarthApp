import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import '@tensorflow/tfjs-backend-webgl';

let detector = null;
let isAnalyzing = false;
let animationFrameId = null;

const initializeDetector = async () => {
  try {
    await tf.ready();
    await tf.setBackend('webgl');
    
    if (!detector) {
      detector = await handpose.load();
    }
    return detector;
  } catch (error) {
    console.error('Error initializing hand detector:', error);
    throw error;
  }
};

const drawHand = (landmarks, ctx) => {
  // Draw all keypoints
  landmarks.forEach(point => {
    const [x, y] = point;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
  });

  // Draw connections
  const fingerConnections = [
    // Thumb
    [0, 1], [1, 2], [2, 3], [3, 4],
    // Index finger
    [0, 5], [5, 6], [6, 7], [7, 8],
    // Middle finger
    [0, 9], [9, 10], [10, 11], [11, 12],
    // Ring finger
    [0, 13], [13, 14], [14, 15], [15, 16],
    // Pinky
    [0, 17], [17, 18], [18, 19], [19, 20]
  ];

  fingerConnections.forEach(([start, end]) => {
    const [x1, y1] = landmarks[start];
    const [x2, y2] = landmarks[end];
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
};

const calculateTapMetrics = (landmarks) => {
  if (!landmarks || landmarks.length === 0) return null;

  // Get thumb and index finger positions
  const thumb = landmarks[4];
  const index = landmarks[8];

  // Calculate distance between thumb and index finger
  const distance = Math.sqrt(
    Math.pow(thumb[0] - index[0], 2) +
    Math.pow(thumb[1] - index[1], 2) +
    Math.pow(thumb[2] - index[2], 2)
  );

  // Determine if a tap occurred (distance threshold)
  const isTapping = distance < 30; // Adjust threshold as needed

  return {
    distance,
    isTapping,
    thumbPosition: thumb,
    indexPosition: index,
    timestamp: Date.now()
  };
};

export const startFingerTapping = async (videoElement, canvasElement, onUpdate) => {
  try {
    const detector = await initializeDetector();
    isAnalyzing = true;

    // Set canvas dimensions to match video
    if (canvasElement) {
      canvasElement.width = videoElement.videoWidth || 640;
      canvasElement.height = videoElement.videoHeight || 480;
    }

    const analyze = async () => {
      if (!isAnalyzing) return;

      try {
        const hands = await detector.estimateHands(videoElement);
        
        if (hands.length > 0) {
          const landmarks = hands[0].landmarks;
          const metrics = calculateTapMetrics(landmarks);
          
          // Draw hand landmarks if canvas is provided
          if (canvasElement) {
            const ctx = canvasElement.getContext('2d');
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            drawHand(landmarks, ctx);
          }
          
          if (metrics && typeof onUpdate === 'function') {
            onUpdate({
              interval: metrics.distance,
              force: metrics.isTapping ? 1 : 0,
              timestamp: metrics.timestamp,
              landmarks: landmarks
            });
          }
        } else if (canvasElement) {
          // Clear canvas if no hands detected
          const ctx = canvasElement.getContext('2d');
          ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }

        if (isAnalyzing) {
          animationFrameId = requestAnimationFrame(analyze);
        }
      } catch (error) {
        console.error('Error during hand analysis:', error);
        stopFingerTapping();
      }
    };

    analyze();

    return {
      stop: stopFingerTapping
    };
  } catch (error) {
    console.error('Error starting finger tapping analysis:', error);
    throw error;
  }
};

export const stopFingerTapping = () => {
  isAnalyzing = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

export default {
  startFingerTapping,
  stopFingerTapping
}; 
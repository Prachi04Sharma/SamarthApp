import { specializedAssessments } from '../api';

const formatLandmarks = (landmarks) => {
  // Convert landmarks object to expected format
  const formattedLandmarks = {};
  
  if (landmarks) {
    Object.entries(landmarks).forEach(([key, points]) => {
      if (Array.isArray(points)) {
        formattedLandmarks[key] = points.map(point => ({
          x: point.x || point._x || 0,
          y: point.y || point._y || 0
        }));
      }
    });
  }
  
  return formattedLandmarks;
};

export const saveFacialAssessment = async (assessmentData) => {
  try {
    if (!assessmentData.userId || !assessmentData.metrics) {
      throw new Error('Missing required fields');
    }

    // Format landmarks properly
    const formattedMetrics = {
      ...assessmentData.metrics,
      landmarks: formatLandmarks(assessmentData.metrics.landmarks)
    };

    const payload = {
      userId: assessmentData.userId,
      timestamp: new Date().toISOString(),
      type: 'FACIAL_SYMMETRY',
      metrics: formattedMetrics,
      status: 'COMPLETED'
    };

    const response = await specializedAssessments.facialSymmetry.save(payload);
    
    if (!response.data) {
      throw new Error('Failed to save assessment');
    }

    return response.data;

  } catch (error) {
    console.error('Error in saveFacialAssessment:', error);
    throw error;
  }
};

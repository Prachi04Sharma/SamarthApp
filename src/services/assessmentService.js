import api, { assessment } from './api';

// Assessment types
export const ASSESSMENT_TYPES = {
  GAIT: 'GAIT_ANALYSIS',
  BALANCE: 'BALANCE_ANALYSIS',
  POSTURAL: 'POSTURAL_ANALYSIS',
  EYE_MOVEMENT: 'EYE_MOVEMENT',
  NECK_MOBILITY: 'NECK_MOBILITY',
  FACIAL_SYMMETRY: 'FACIAL_SYMMETRY',
  TREMOR: 'TREMOR',
  RESPONSE_TIME: 'RESPONSE_TIME',
  SPEECH_PATTERN: 'SPEECH_PATTERN',
  FINGER_TAPPING: 'FINGER_TAPPING'
};

// Backward compatibility for existing components
export const assessmentTypes = {
  FACIAL_SYMMETRY: ASSESSMENT_TYPES.FACIAL_SYMMETRY,
  NECK_MOBILITY: ASSESSMENT_TYPES.NECK_MOBILITY,
  ...ASSESSMENT_TYPES
};

// Assessment service implementation
export const assessmentService = {
  // Save assessment result
  async saveAssessment(userId, type, metrics) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Process metrics based on assessment type
      const processedMetrics = processAssessmentData(type, metrics);

      const assessmentData = {
        userId,
        type: ASSESSMENT_TYPES[type] || type,  // Use enum value or original type if already correct
        data: processedMetrics,    // Raw data for future reference
        metrics: processedMetrics,  // Processed metrics for validation
        timestamp: new Date().toISOString()
      };

      console.log('Saving assessment data:', {
        ...assessmentData,
        userId: '[REDACTED]'  // Log without sensitive data
      });

      const response = await api.post('/assessments', assessmentData);
      return response.data;
    } catch (error) {
      console.error('Error saving assessment:', error);
      if (error.response?.data) {
        console.error('Server error details:', error.response.data);
      }
      throw error;
    }
  },

  // Get user's assessment history
  getAssessmentHistory: async (userId, type = null) => {
    try {
      const assessments = await assessment.getHistory(type);
      return assessments;
    } catch (error) {
      console.error('Error getting assessment history:', error);
      throw error;
    }
  },

  // Get baseline data for an assessment type
  getBaselineData: async (type) => {
    try {
      if (!type) {
        throw new Error('Assessment type is required');
      }
      const response = await assessment.getBaseline(type);
      return response.data;
    } catch (error) {
      console.error(`Failed to get baseline data for ${type}:`, error);
      return null;
    }
  },

  // Get assessment statistics
  getAssessmentStats: async (userId) => {
    try {
      const assessments = await assessment.getHistory();
      
      // Group assessments by type
      const groupedAssessments = assessments.reduce((acc, curr) => {
        if (!acc[curr.type]) acc[curr.type] = [];
        acc[curr.type].push(curr);
        return acc;
      }, {});

      // Calculate statistics for each assessment type
      const stats = {};
      Object.entries(groupedAssessments).forEach(([type, typeAssessments]) => {
        stats[type] = {
          count: typeAssessments.length,
          lastCompleted: typeAssessments[0]?.timestamp,
          averageScore: calculateAverageScore(type, typeAssessments),
          trend: calculateTrend(type, typeAssessments),
          recentScores: getRecentScores(type, typeAssessments, 5)
        };
      });

      return stats;
    } catch (error) {
      console.error('Error getting assessment statistics:', error);
      throw error;
    }
  },

  // Compare assessment results with baseline
  compareWithBaseline: (current, baseline) => {
    if (!baseline) return null;

    const calculatePercentageChange = (current, baseline) => {
      if (baseline === 0) return 0;
      return ((current - baseline) / baseline) * 100;
    };

    const comparison = {};
    
    Object.keys(current).forEach(metric => {
      if (typeof current[metric] === 'number' && typeof baseline[metric] === 'number') {
        comparison[metric] = {
          current: current[metric],
          baseline: baseline[metric],
          change: calculatePercentageChange(current[metric], baseline[metric])
        };
      } else if (typeof current[metric] === 'object' && baseline[metric]) {
        comparison[metric] = assessmentService.compareWithBaseline(current[metric], baseline[metric]);
      }
    });

    return comparison;
  }
};

// Helper function to process assessment data based on type
const processAssessmentData = (type, data) => {
  switch (type) {
    case ASSESSMENT_TYPES.GAIT:
      // Process raw gait analysis data into meaningful metrics
      const processedGaitData = {
        stability: calculateStabilityScore(data) || data.stability || 0,
        balance: calculateBalanceScore(data) || data.balance || 0,
        symmetry: calculateSymmetryScore(data) || data.symmetry || 0,
        jointAngles: processJointAngles(data.jointAngles) || []
      };
      
      // Add overall score
      processedGaitData.overallScore = (
        processedGaitData.stability * 0.4 +
        processedGaitData.balance * 0.3 +
        processedGaitData.symmetry * 0.3
      );
      
      return processedGaitData;
    case ASSESSMENT_TYPES.BALANCE:
      return {
        overallBalance: data.overallBalance || 0,
        posturalSway: data.posturalSway || { lateral: 0, anterior: 0 },
        weightDistribution: data.weightDistribution || { left: 50, right: 50 },
        stabilityScore: data.stabilityScore || 0
      };
    case ASSESSMENT_TYPES.POSTURAL:
      return {
        spinalAlignment: data.spinalAlignment || 0,
        shoulderAlignment: data.shoulderAlignment || 0,
        hipAlignment: data.hipAlignment || 0,
        headPosition: data.headPosition || { forward: 0, tilt: 0 },
        overallPosture: data.overallPosture || 0
      };
    case ASSESSMENT_TYPES.EYE_MOVEMENT:
      return {
        accuracy: data.accuracy || 0,
        speed: data.speed || 0,
        smoothness: data.smoothness || 0,
        tracking: data.tracking || 0
      };
    case ASSESSMENT_TYPES.NECK_MOBILITY:
      return {
        flexion: data.flexion || 0,
        extension: data.extension || 0,
        rotation: data.rotation || 0,
        lateralBending: data.lateralBending || 0
      };
    case ASSESSMENT_TYPES.FACIAL_SYMMETRY:
      return {
        symmetryScore: data.symmetryScore || 0,
        eyeAlignment: data.eyeAlignment || 0,
        mouthAlignment: data.mouthAlignment || 0,
        overallSymmetry: data.overallSymmetry || 0,
        eyeSymmetry: data.eyeSymmetry || 0,
        mouthSymmetry: data.mouthSymmetry || 0,
        jawSymmetry: data.jawSymmetry || 0,
        landmarks: data.landmarks || {}
      };
    case ASSESSMENT_TYPES.TREMOR:
      return {
        amplitude: data.amplitude || 0,
        frequency: data.frequency || 0,
        regularity: data.regularity || 0,
        overallScore: data.overallScore || 0
      };
    case ASSESSMENT_TYPES.RESPONSE_TIME:
      return {
        averageResponseTime: data.averageResponseTime || 0,
        accuracy: data.accuracy || 0,
        consistency: data.consistency || 0
      };
    case ASSESSMENT_TYPES.SPEECH_PATTERN:
      return {
        clarity: data.clarity || 0,
        rhythm: data.rhythm || 0,
        speed: data.speed || 0,
        overallQuality: data.overallQuality || 0
      };
    case ASSESSMENT_TYPES.FINGER_TAPPING:
      const overallScore = data.overallScore || 
        ((data.tapsPerSecond || 0) * 0.4 + 
         (data.accuracy || 0) * 0.3 + 
         (data.rhythmScore || 0) * 0.3);
      
      return {
        frequency: data.tapsPerSecond || data.frequency || 0,
        amplitude: data.accuracy || data.amplitude || 0,
        rhythm: data.rhythmScore || data.rhythm || 0,
        overallScore: overallScore
      };
    default:
      return data;
  }
};

// Helper function to calculate average score
const calculateAverageScore = (type, assessments) => {
  if (!assessments.length) return 0;
  
  const scores = assessments.map(assessment => {
    switch (type) {
      case ASSESSMENT_TYPES.GAIT:
        return (assessment.data.stability + assessment.data.balance + assessment.data.symmetry) / 3;
      case ASSESSMENT_TYPES.BALANCE:
        return assessment.data.overallBalance;
      case ASSESSMENT_TYPES.POSTURAL:
        return assessment.data.overallPosture;
      case ASSESSMENT_TYPES.EYE_MOVEMENT:
        return assessment.data.accuracy;
      case ASSESSMENT_TYPES.NECK_MOBILITY:
        return (assessment.data.flexion + assessment.data.extension + assessment.data.rotation + assessment.data.lateralBending) / 4;
      case ASSESSMENT_TYPES.FACIAL_SYMMETRY:
        return assessment.data.symmetryScore;
      case ASSESSMENT_TYPES.TREMOR:
        return assessment.data.overallScore;
      case ASSESSMENT_TYPES.RESPONSE_TIME:
        return 100 - (assessment.data.averageResponseTime / 1000 * 100);
      case ASSESSMENT_TYPES.SPEECH_PATTERN:
        return assessment.data.overallQuality;
      case ASSESSMENT_TYPES.FINGER_TAPPING:
        return assessment.data.overallScore;
      default:
        return 0;
    }
  });

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

// Helper function to calculate trend
const calculateTrend = (type, assessments) => {
  if (assessments.length < 2) return 'stable';

  const recentScores = getRecentScores(type, assessments, 5);
  const firstScore = recentScores[recentScores.length - 1];
  const lastScore = recentScores[0];
  
  const percentChange = ((lastScore - firstScore) / firstScore) * 100;
  
  if (percentChange > 5) return 'improving';
  if (percentChange < -5) return 'declining';
  return 'stable';
};

// Helper function to get recent scores
const getRecentScores = (type, assessments, count) => {
  return assessments
    .slice(0, count)
    .map(assessment => calculateAverageScore(type, [assessment]))
    .filter(score => !isNaN(score));
};

// Helper functions for gait analysis
const calculateStabilityScore = (data) => {
  // TODO: Implement stability calculation based on joint movements
  return data.stability;
};

const calculateBalanceScore = (data) => {
  // TODO: Implement balance calculation based on center of mass
  return data.balance;
};

const calculateSymmetryScore = (data) => {
  // TODO: Implement symmetry calculation based on left/right comparison
  return data.symmetry;
};

const processJointAngles = (angles) => {
  if (!Array.isArray(angles)) return [];
  // TODO: Process and normalize joint angles
  return angles;
};

export default assessmentService; 
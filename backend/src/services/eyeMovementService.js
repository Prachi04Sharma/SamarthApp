import EyeMovementAssessment from '../models/EyeMovementAssessment.js';

export const eyeMovementService = {
  async saveAssessment(assessmentData) {
    try {
      if (!assessmentData.userId || !assessmentData.metrics) {
        throw new Error('Missing required fields');
      }

      // Ensure all required metrics are present
      const requiredMetrics = ['CALIBRATION', 'SACCADIC_TEST', 'PURSUIT_TEST', 'FIXATION_TEST'];
      for (const metric of requiredMetrics) {
        if (!assessmentData.metrics[metric]) {
          assessmentData.metrics[metric] = {
            summary: {},
            temporal: {
              velocities: [],
              ears: [],
              positions: [],
              saccades: [],
              fixations: [],
              blinks: []
            }
          };
        }
      }

      const assessment = new EyeMovementAssessment({
        userId: assessmentData.userId,
        timestamp: assessmentData.timestamp,
        type: assessmentData.type,
        metrics: assessmentData.metrics
      });

      const saved = await assessment.save();
      
      if (!saved) {
        throw new Error('Failed to save assessment');
      }

      return {
        success: true,
        data: {
          _id: saved._id,
          id: saved._id,
          ...saved.toObject()
        }
      };

    } catch (error) {
      console.error('Error in saveAssessment:', error);
      throw error;
    }
  },

  async getHistory(userId, limit = 10) {
    try {
      return await EyeMovementAssessment.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('Error getting eye movement history:', error);
      throw error;
    }
  },

  async getBaseline(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const baseline = await EyeMovementAssessment.findOne({ 
        userId,
        status: 'COMPLETED'
      })
      .sort({ timestamp: -1 })
      .lean();

      return baseline;
    } catch (error) {
      console.error('Error getting eye movement baseline:', error);
      throw error;
    }
  },

  async analyzeNeurologicalIndicators(assessmentData) {
    // Add specialized analysis logic here
    return assessmentData;
  }
};

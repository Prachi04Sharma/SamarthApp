import TremorAssessment from '../models/TremorAssessment.js';

// Helper function to map tremor types from ML service to database enum values
function mapTremorType(mlTremorType) {
  // Map ML service tremor types to database enum values
  const typeMapping = {
    'None': 'None',
    'Very Slow': 'Very Slow',
    'Slow Tremor': 'Very Slow', // Map Slow Tremor to Very Slow
    'Resting': 'Resting',
    'Postural': 'Postural',
    'Action/Intention': 'Action/Intention',
    'Irregular': 'Irregular'
  };

  return typeMapping[mlTremorType] || 'None';
}

export const tremorService = {
  async saveAssessment(assessmentData) {
    try {
      if (!assessmentData.userId || !assessmentData.metrics) {
        throw new Error('Missing required fields');
      }

      // Map tremor type to valid enum value
      if (assessmentData.metrics.tremor_type) {
        assessmentData.metrics.tremor_type = mapTremorType(assessmentData.metrics.tremor_type);
      }

      // Calculate overall scores
      const tremorScore = calculateTremorScore(assessmentData.metrics);

      // Format metrics data for storage
      const formattedMetrics = {
        ...assessmentData.metrics, // Keep original metrics
        overall: {
          tremorScore
        }
      };

      const assessment = new TremorAssessment({
        userId: assessmentData.userId,
        timestamp: assessmentData.timestamp || new Date(),
        type: assessmentData.type || 'tremor',
        metrics: formattedMetrics
      });

      const saved = await assessment.save();
      
      if (!saved) {
        throw new Error('Failed to save tremor assessment');
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
      console.error('Error in tremorService.saveAssessment:', error);
      throw error;
    }
  },

  async getHistory(userId, limit = 10) {
    try {
      return await TremorAssessment.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('Error getting tremor assessment history:', error);
      throw error;
    }
  },

  async getBaseline(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const baseline = await TremorAssessment.findOne({ 
        userId,
        status: 'COMPLETED'
      })
      .sort({ timestamp: -1 })
      .lean();

      return baseline;
    } catch (error) {
      console.error('Error getting tremor baseline:', error);
      throw error;
    }
  }
};

// Helper function to calculate overall tremor score
function calculateTremorScore(metrics) {
  // Calculate a score between 0-100 based on frequency and amplitude
  // Higher frequency and amplitude = higher score = worse condition
  
  let frequencyFactor = 0;
  if (metrics.tremor_frequency > 0) {
    // Score increases with frequency, up to about 12Hz
    frequencyFactor = Math.min(100, metrics.tremor_frequency * 8.33);
  }
  
  const amplitudeFactor = Math.min(100, metrics.tremor_amplitude || 0);
  
  // Weighted average (amplitude matters more)
  const tremorScore = (frequencyFactor * 0.4 + amplitudeFactor * 0.6);
  
  return Math.min(100, Math.max(0, tremorScore));
}

import { facialSymmetryService } from '../services/facialSymmetryService.js';

export const facialSymmetryController = {
  async save(req, res) {
    try {
      const { userId, symmetry_score, landmarks, midline, metrics, neurological_indicators } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      // Save assessment with original format
      const assessment = await facialSymmetryService.saveAssessment({
        userId,
        symmetry_score,
        landmarks,
        midline,
        metrics,
        neurological_indicators,
        timestamp: new Date(),
        status: 'COMPLETED'
      });

      res.status(201).json({
        success: true,
        data: assessment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async getHistory(req, res) {
    try {
      const { userId, limit } = req.query;
      const history = await facialSymmetryService.getHistory(userId, limit);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async getBaseline(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const baseline = await facialSymmetryService.getBaseline(userId);
      
      // If no baseline found, return empty data with 200 status
      if (!baseline) {
        return res.json({
          success: true,
          data: null
        });
      }

      res.json({
        success: true,
        data: baseline
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

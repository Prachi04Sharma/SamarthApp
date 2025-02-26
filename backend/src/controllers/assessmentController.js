import Assessment from '../models/Assessment.js';

export const getBaselineData = async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) {
      return res.status(400).json({ message: 'Assessment type is required' });
    }

    // Find the most recent assessment of this type for the user
    const baseline = await Assessment.findOne({
      user: req.user.userId,
      type,
      status: 'COMPLETED'
    }).sort({ createdAt: -1 });

    if (!baseline) {
      return res.json({ message: 'No baseline data found', data: null });
    }

    res.json({
      message: 'Baseline data retrieved successfully',
      data: baseline
    });
  } catch (error) {
    console.error('Get baseline error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const saveAssessment = async (req, res) => {
  try {
    const { userId, type, data, metrics, status, timestamp } = req.body;

    console.log('Received assessment data:', req.body);

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'type is required'
      });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'data object is required'
      });
    }

    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'metrics object is required'
      });
    }

    // Create new assessment
    const assessment = new Assessment({
      userId,
      type,
      data,
      metrics,
      status: status || 'COMPLETED',
      timestamp: timestamp || new Date()
    });

    // Save to database
    const savedAssessment = await assessment.save();

    res.status(201).json({
      success: true,
      data: savedAssessment
    });
  } catch (error) {
    console.error('Error saving assessment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

export const getAssessmentHistory = async (req, res) => {
  try {
    const { userId, type, limit = 10 } = req.query;

    const query = { userId };
    if (type) query.type = type;

    const assessments = await Assessment.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: assessments
    });
  } catch (error) {
    console.error('Error getting assessment history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findOneAndDelete({
      _id: id,
      user: req.user.userId
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

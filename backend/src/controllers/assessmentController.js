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
    const { type, data, metrics } = req.body;

    const assessment = new Assessment({
      user: req.user.userId,
      type,
      data,
      metrics,
      status: 'COMPLETED'
    });

    await assessment.save();

    res.status(201).json({
      message: 'Assessment saved successfully',
      assessment
    });
  } catch (error) {
    console.error('Save assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAssessmentHistory = async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    const query = { user: req.user.userId };
    if (type) query.type = type;

    const assessments = await Assessment.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      message: 'Assessment history retrieved successfully',
      data: assessments
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Server error' });
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

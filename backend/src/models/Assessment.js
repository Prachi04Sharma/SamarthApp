import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['GAIT_ANALYSIS', 'EYE_MOVEMENT', 'FACIAL_SYMMETRY', 'TREMOR', 'RESPONSE_TIME', 'FINGER_TAPPING']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  metrics: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['IN_PROGRESS', 'COMPLETED', 'FAILED'],
    default: 'IN_PROGRESS'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
assessmentSchema.index({ user: 1, type: 1, createdAt: -1 });

// Static method to get baseline data
assessmentSchema.statics.getBaselineData = async function(userId, type) {
  return this.findOne({
    user: userId,
    type,
    baseline: true
  }).sort({ timestamp: -1 });
};

// Static method to get assessment history
assessmentSchema.statics.getAssessmentHistory = async function(userId, type, limit = 10) {
  return this.find({
    user: userId,
    type
  })
    .sort({ timestamp: -1 })
    .limit(limit);
};

const Assessment = mongoose.model('Assessment', assessmentSchema);

export default Assessment; 
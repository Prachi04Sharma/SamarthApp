import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema({
  x: Number,
  y: Number
}, { _id: false });

const facialSymmetrySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'FAILED', 'IN_PROGRESS'],
    default: 'COMPLETED'
  },
  metrics: {
    overallSymmetry: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    eyeSymmetry: {
      left: {
        position: { x: Number, y: Number },
        size: Number,
        openness: Number
      },
      right: {
        position: { x: Number, y: Number },
        size: Number,
        openness: Number
      },
      alignmentScore: Number
    },
    mouthSymmetry: {
      centerDeviation: Number,
      cornerAlignment: Number,
      symmetryScore: Number
    },
    jawSymmetry: {
      leftAngle: Number,
      rightAngle: Number,
      symmetryScore: Number
    },
    landmarks: {
      leftEye: [pointSchema],
      rightEye: [pointSchema],
      mouth: [pointSchema],
      jawline: [pointSchema],
      nose: [pointSchema]
    }
  },
  analysisResults: {
    symmetryClassification: {
      type: String,
      enum: ['NORMAL', 'MILD_ASYMMETRY', 'MODERATE_ASYMMETRY', 'SEVERE_ASYMMETRY']
    },
    deviationScores: {
      eyeDeviation: Number,
      mouthDeviation: Number,
      jawDeviation: Number
    },
    confidence: Number
  }
});

const FacialSymmetryAssessment = mongoose.model('FacialSymmetryAssessment', facialSymmetrySchema);
export default FacialSymmetryAssessment;

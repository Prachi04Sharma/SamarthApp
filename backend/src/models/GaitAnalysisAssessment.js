import mongoose from 'mongoose';

const gaitAnalysisSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    default: 'gaitAnalysis'
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'FAILED', 'IN_PROGRESS'],
    default: 'COMPLETED'
  },
  metrics: {
    stability: {
      score: Number,
      lateralSway: Number,
      verticalSway: Number
    },
    balance: {
      score: Number,
      leftRightDistribution: Number
    },
    symmetry: {
      overall: Number,
      legSymmetry: Number,
      armSymmetry: Number
    },
    jointAngles: {
      hipLeft: Number,
      hipRight: Number,
      kneeLeft: Number,
      kneeRight: Number,
      ankleLeft: Number,
      ankleRight: Number
    },
    gait: {
      speed: Number,
      strideLength: Number,
      cadence: Number,
      walkingTime: Number
    },
    overall: {
      mobilityScore: Number,
      stabilityScore: Number,
      symmetryScore: Number
    },
    timeSeriesData: {
      timestamps: [Number],
      acceleration: [{
        x: Number,
        y: Number
      }],
      balance: [Number],
      phaseData: [{
        x: Number,
        y: Number,
        timestamp: Number
      }],
      stabilityData: {
        timeSeriesData: [{
          timestamp: Number,
          stability: Number,
          lateralSway: Number,
          verticalSway: Number
        }]
      },
      jointData: {
        timestamps: [Number],
        hipAngles: [Number],
        kneeAngles: [Number],
        ankleAngles: [Number]
      },
      symmetryData: [Number]
    }
  }
}, {
  timestamps: true
});

const GaitAnalysisAssessment = mongoose.model('GaitAnalysisAssessment', gaitAnalysisSchema);
export default GaitAnalysisAssessment;

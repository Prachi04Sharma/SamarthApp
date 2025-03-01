import SpeechPatternAssessment from '../models/SpeechPatternAssessment.js';

export const speechPatternService = {
  async saveAssessment(assessmentData) {
    try {
      if (!assessmentData.userId || !assessmentData.metrics) {
        throw new Error('Missing required fields');
      }

      // Ensure we have all required metric fields with defaults if missing
      const metrics = {
        clarity: {
          score: ensureNumber(assessmentData.metrics.clarity?.score || assessmentData.metrics.clarity),
          pronunciation: ensureNumber(assessmentData.metrics.clarity?.pronunciation || 0),
          articulation: ensureNumber(assessmentData.metrics.clarity?.articulation || 0)
        },
        fluency: {
          speechRate: ensureNumber(assessmentData.metrics.speechRate || assessmentData.metrics.fluency?.speechRate),
          wordCount: ensureNumber(assessmentData.metrics.wordCount || assessmentData.metrics.fluency?.wordCount || 0),
          syllableCount: ensureNumber(assessmentData.metrics.syllableCount || assessmentData.metrics.fluency?.syllableCount || 0),
          pauseCount: ensureNumber(assessmentData.metrics.pauseCount || assessmentData.metrics.fluency?.pauseCount || 0),
          pauseDuration: ensureNumber(assessmentData.metrics.pauseDuration || assessmentData.metrics.fluency?.pauseDuration || 0),
          fillerWordCount: ensureNumber(assessmentData.metrics.fillerWordCount || assessmentData.metrics.fluency?.fillerWordCount || 0)
        },
        volume: {
          mean: ensureNumber(assessmentData.metrics.volume?.mean || 0),
          variability: ensureNumber(assessmentData.metrics.volume?.variability || 0),
          control: ensureNumber(assessmentData.metrics.volumeControl || assessmentData.metrics.volume?.control || 0)
        },
        prosody: {
          pitchVariability: ensureNumber(assessmentData.metrics.pitchVariation || assessmentData.metrics.prosody?.pitchVariability || 0),
          intonation: ensureNumber(assessmentData.metrics.prosody?.intonation || 0),
          rhythm: ensureNumber(assessmentData.metrics.prosody?.rhythm || 0),
          stress: ensureNumber(assessmentData.metrics.prosody?.stress || 0)
        },
        cognition: {
          hesitations: ensureNumber(assessmentData.metrics.emotionalMarkers?.hesitation || assessmentData.metrics.cognition?.hesitations || 0),
          repetitions: ensureNumber(assessmentData.metrics.cognition?.repetitions || 0),
          revisions: ensureNumber(assessmentData.metrics.cognition?.revisions || 0),
          stutter: {
            count: ensureNumber(assessmentData.metrics.stuttering || assessmentData.metrics.cognition?.stutter?.count || 0),
            severity: ensureNumber(assessmentData.metrics.cognition?.stutter?.severity || 0)
          }
        },
        emotion: {
          confidence: ensureNumber(assessmentData.metrics.emotionalMarkers?.confidence || assessmentData.metrics.emotion?.confidence || 0),
          stress: ensureNumber(assessmentData.metrics.emotionalMarkers?.stress || assessmentData.metrics.emotion?.stress || 0),
          flatness: ensureNumber(assessmentData.metrics.emotion?.flatness || 0)
        },
        duration: ensureNumber(assessmentData.metrics.duration),
        transcript: assessmentData.transcript || assessmentData.metrics.transcript || '',
      };

      // Calculate overall metrics if not provided
      metrics.overall = {
        intelligibilityScore: ensureNumber(assessmentData.metrics.overall?.intelligibilityScore || 
          calculateIntelligibilityScore(metrics)),
        naturalness: ensureNumber(assessmentData.metrics.overall?.naturalness || 
          calculateNaturalnessScore(metrics)),
        communicationEfficiency: ensureNumber(assessmentData.metrics.overall?.communicationEfficiency || 
          calculateCommunicationEfficiencyScore(metrics)),
        compositeScore: ensureNumber(assessmentData.metrics.overallScore || assessmentData.metrics.overall?.compositeScore || 
          calculateCompositeScore(metrics))
      };

      // Include raw data if available
      if (assessmentData.metrics.rawData) {
        metrics.rawData = {
          waveform: Array.isArray(assessmentData.metrics.rawData.waveform) ? 
            assessmentData.metrics.rawData.waveform : [],
          pitchData: Array.isArray(assessmentData.metrics.rawData.pitchData) ? 
            assessmentData.metrics.rawData.pitchData : [],
          volumeData: Array.isArray(assessmentData.metrics.rawData.volumeData) ? 
            assessmentData.metrics.rawData.volumeData : [],
          timestamps: Array.isArray(assessmentData.metrics.rawData.timestamps) ? 
            assessmentData.metrics.rawData.timestamps : [],
          emotionalMarkers: {
            confidencePoints: Array.isArray(assessmentData.metrics.rawData.emotionalMarkers?.confidencePoints) ? 
              assessmentData.metrics.rawData.emotionalMarkers.confidencePoints : [],
            stressPoints: Array.isArray(assessmentData.metrics.rawData.emotionalMarkers?.stressPoints) ? 
              assessmentData.metrics.rawData.emotionalMarkers.stressPoints : [],
            hesitationPoints: Array.isArray(assessmentData.metrics.rawData.emotionalMarkers?.hesitationPoints) ? 
              assessmentData.metrics.rawData.emotionalMarkers.hesitationPoints : []
          }
        };
      }

      const assessment = new SpeechPatternAssessment({
        userId: assessmentData.userId,
        timestamp: assessmentData.timestamp || new Date(),
        type: assessmentData.type || 'speechPattern',
        metrics
      });

      const saved = await assessment.save();
      
      if (!saved) {
        throw new Error('Failed to save speech pattern assessment');
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
      console.error('Error in speechPatternService.saveAssessment:', error);
      throw error;
    }
  },

  async getHistory(userId, limit = 10) {
    try {
      return await SpeechPatternAssessment.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('Error getting speech pattern history:', error);
      throw error;
    }
  },

  async getBaseline(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const baseline = await SpeechPatternAssessment.findOne({ 
        userId,
        status: 'COMPLETED'
      })
      .sort({ timestamp: -1 })
      .lean();

      return baseline;
    } catch (error) {
      console.error('Error getting speech pattern baseline:', error);
      throw error;
    }
  }
};

// Helper functions to ensure we never save NaN values
function ensureNumber(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return 0;
  }
  return value;
}

function calculateIntelligibilityScore(metrics) {
  // Weighted calculation of intelligibility based on clarity and cognitive factors
  const clarity = metrics.clarity.score || 0;
  const stutterSeverity = metrics.cognition.stutter.severity || 0;
  const hesitationImpact = Math.max(0, 100 - (metrics.cognition.hesitations * 5)) || 0;
  
  return (clarity * 0.6 + hesitationImpact * 0.2 + (100 - stutterSeverity) * 0.2);
}

function calculateNaturalnessScore(metrics) {
  // Weighted calculation for how natural the speech sounds
  const prosodyScore = (
    (metrics.prosody.pitchVariability || 0) +
    (metrics.prosody.intonation || 0) +
    (metrics.prosody.rhythm || 0) +
    (metrics.prosody.stress || 0)
  ) / 4;
  
  const fluidityScore = Math.max(0, 100 - (
    (metrics.cognition.hesitations || 0) * 2 +
    (metrics.cognition.repetitions || 0) * 3 +
    (metrics.cognition.stutter.count || 0) * 5
  ));

  return (prosodyScore * 0.6 + fluidityScore * 0.4);
}

function calculateCommunicationEfficiencyScore(metrics) {
  // Efficiency combines rate, clarity and cognitive factors
  const speechRateScore = Math.min(100, metrics.fluency.speechRate / 1.5);
  const clarityScore = metrics.clarity.score || 0;
  const pauseImpact = Math.max(0, 100 - (metrics.fluency.pauseCount * 5));
  
  return (speechRateScore * 0.4 + clarityScore * 0.4 + pauseImpact * 0.2);
}

function calculateCompositeScore(metrics) {
  // Calculate overall speech assessment score if not provided
  const clarityWeight = 0.3;
  const fluencyWeight = 0.2;
  const prosodyWeight = 0.2;
  const cognitiveWeight = 0.2;
  const volumeWeight = 0.1;
  
  const clarityScore = metrics.clarity.score || 0;
  const fluencyScore = metrics.fluency.speechRate ? Math.min(100, metrics.fluency.speechRate / 1.5) : 0;
  const volumeScore = metrics.volume.control || 0;
  
  // Calculate prosody score
  const prosodyScore = (
    (metrics.prosody.pitchVariability || 0) + 
    (metrics.prosody.intonation || 0) + 
    (metrics.prosody.rhythm || 0) + 
    (metrics.prosody.stress || 0)
  ) / 4;
  
  // Calculate cognitive impact score (higher is better)
  const cognitiveImpact = Math.max(0, 100 - (
    (metrics.cognition.hesitations || 0) * 2 +
    (metrics.cognition.repetitions || 0) * 3 +
    (metrics.cognition.stutter.count || 0) * 5
  ));
  
  // Weighted average
  return (
    clarityScore * clarityWeight +
    fluencyScore * fluencyWeight +
    volumeScore * volumeWeight +
    prosodyScore * prosodyWeight +
    cognitiveImpact * cognitiveWeight
  );
}

import axios from 'axios';

// Use the provided API key
const GEMINI_API_KEY = 'AIzaSyC_9o4uCAR0TStMXBm-cPIWzTQB95XCWEY';
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = 'gemini-2.0-flash'; // Use the free tier Gemini model

console.log('Initializing AI service with API key ending with:', GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 5));

// Helper function to transform assessment data into the expected format
function transformAssessmentsData(assessments) {
  // Initialize the transformed data structure with all 8 assessment types
  const transformedData = {
    tremor: null,
    speech: null,
    responseTime: null,
    facialSymmetry: null,
    fingerTapping: null,
    eyeMovement: null,
    gaitAnalysis: null,
    neckMobility: null
  };
  
  console.log(`Processing ${assessments.length} assessments for AI analysis`);
  
  // Process each assessment and map to the expected structure
  assessments.forEach(assessment => {
    if (!assessment.type && !assessment.metrics) {
      console.log('Skipping assessment with missing type or metrics');
      return;
    }
    
    // Map the database assessment type to our internal type
    let mappedType;
    const assessmentType = assessment.type ? assessment.type.toUpperCase() : '';
    
    switch(assessmentType) {
      case 'TREMOR':
        mappedType = 'tremor';
        break;
      case 'SPEECH_PATTERN':
      case 'SPEECHPATTERN':
        mappedType = 'speech';
        break;
      case 'RESPONSE_TIME':
      case 'RESPONSETIME':
        mappedType = 'responseTime';
        break;
      case 'FACIAL_SYMMETRY':
      case 'FACIALSYMMETRY':
        mappedType = 'facialSymmetry';
        break;
      case 'FINGER_TAPPING':
      case 'FINGERTAPPING':
        mappedType = 'fingerTapping';
        break;
      case 'EYE_MOVEMENT':
      case 'EYEMOVEMENT':
        mappedType = 'eyeMovement';
        break;
      case 'GAIT_ANALYSIS':
      case 'GAITANALYSIS':
        mappedType = 'gaitAnalysis';
        break;
      case 'NECK_MOBILITY':
      case 'NECKMOBILITY':
        mappedType = 'neckMobility';
        break;
      default:
        console.log(`Unknown assessment type: ${assessment.type}`);
        return;
    }
    
    // Take the most recent assessment of each type (if there are multiple)
    if (!transformedData[mappedType] || 
        new Date(assessment.timestamp) > new Date(transformedData[mappedType].timestamp)) {
      
      console.log(`Using ${mappedType} assessment from ${assessment.timestamp}`);
      
      // Store the transformed assessment with proper handling for nested data
      transformedData[mappedType] = {
        timestamp: assessment.timestamp,
        metrics: assessment.metrics,
        // Also include neurological_indicators if present for facialSymmetry
        neurological_indicators: assessment.neurological_indicators || 
                                assessment.metrics?.neurological_indicators
      };
    }
  });
  
  // Log what assessment types we found
  const foundTypes = Object.keys(transformedData).filter(type => transformedData[type] !== null);
  console.log(`Found assessment data for: ${foundTypes.join(', ')}`);
  
  return transformedData;
}

// Main function to get AI analysis results from assessments array
export const getAiAnalysisResults = async (assessments) => {
  try {
    // Validate input
    if (!assessments || !Array.isArray(assessments) || assessments.length === 0) {
      console.error('No assessments provided for AI analysis');
      throw new Error('No assessment data available for analysis');
    }
    
    console.log(`Received ${assessments.length} assessments for AI analysis`);
    
    // Transform the assessments array into the expected format
    const transformedData = transformAssessmentsData(assessments);
    
    // Check if we have enough data to make a meaningful analysis
    const availableTypes = Object.keys(transformedData).filter(type => transformedData[type] !== null);
    if (availableTypes.length === 0) {
      console.error('No valid assessment data found for analysis');
      throw new Error('No valid assessment data found for analysis');
    }
    
    // Log available data for facial symmetry to help with debugging
    if (transformedData.facialSymmetry) {
      console.log('Facial Symmetry data available:', {
        hasMetrics: !!transformedData.facialSymmetry.metrics,
        hasNeurologicalIndicators: !!(transformedData.facialSymmetry.neurological_indicators || 
                                     transformedData.facialSymmetry.metrics?.neurological_indicators),
        bellsPalsyData: transformedData.facialSymmetry.neurological_indicators?.bells_palsy || 
                        transformedData.facialSymmetry.metrics?.neurological_indicators?.bells_palsy || 'Not Available'
      });
    } else {
      console.log('No facial symmetry data available for AI analysis');
    }
    
    console.log(`Preparing AI analysis with ${availableTypes.length} assessment types:`, availableTypes);
    
    // Create a comprehensive prompt for the AI model
    const prompt = createAiPrompt(transformedData);
    
    console.log('Making API call to Gemini for comprehensive analysis');
    console.log('Prompt length:', prompt.length);
    
    // Make API call to Gemini
    const response = await axios.post(
      `${API_BASE_URL}/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
          responseMimeType: "application/json"
        }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Gemini API response received with status:', response.status);
    
    // Extract text from response
    const text = response.data.candidates[0].content.parts[0].text;
    console.log('Response text length:', text.length);
    console.log('Sample response:', text.substring(0, 200).replace(/\n/g, '\\n'));
    
    // Parse response
    const parsedResponse = parseAiResponse(text);
    console.log('Parsed response with keys:', Object.keys(parsedResponse));
    
    return parsedResponse;
  } catch (error) {
    console.error('Error in getAiAnalysisResults:', error);
    
    if (error.response) {
      console.error('API Error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    // Return a fallback response in case of error
    return {
      error: true,
      message: `Analysis failed: ${error.message}`,
      parkinsonsDisease: { 
        riskLevel: "unknown", 
        confidence: 0,
        indicators: ["Unable to analyze due to an error"],
        recommendations: ["Consult with a healthcare professional"] 
      },
      bellsPalsy: { 
        riskLevel: "unknown", 
        confidence: 0,
        indicators: ["Unable to analyze due to an error"],
        recommendations: ["Consult with a healthcare professional"] 
      },
      als: { 
        riskLevel: "unknown", 
        confidence: 0,
        indicators: ["Unable to analyze due to an error"],
        recommendations: ["Consult with a healthcare professional"] 
      },
      overallAssessment: "Analysis could not be completed due to a technical issue.",
      disclaimerNote: "This is an automated AI analysis and should not replace professional medical diagnosis."
    };
  }
};

// Original getAiPrediction function (now serves as a backup or alternative approach)
export const getAiPrediction = async (assessmentData) => {
  try {
    // Validate assessment data before processing
    if (!assessmentData || typeof assessmentData !== 'object') {
      throw new Error('Invalid assessment data provided');
    }
    
    console.log('Processing assessment data with keys:', Object.keys(assessmentData));
    
    // Format assessment data for AI analysis
    const prompt = createAiPrompt(assessmentData);
    
    console.log('Making API call to Gemini with prompt length:', prompt.length);
    console.log('API endpoint:', `${API_BASE_URL}/models/${MODEL}:generateContent`);
    
    // Make a real API call to Gemini API
    const response = await axios.post(
      `${API_BASE_URL}/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2, // Lower temperature for more consistent results
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Gemini API response received with status:', response.status);
    
    // Extract the text from the response
    const text = response.data.candidates[0].content.parts[0].text;
    console.log('Successfully extracted text from Gemini response, length:', text.length);
    
    // Log a snippet of the response for debugging
    console.log('Response snippet (first 100 chars):', text.substring(0, 100));
    
    // Parse the AI response to extract structured data
    const analysis = parseAiResponse(text);
    
    return {
      rawResponse: text,
      structuredAnalysis: analysis
    };
  } catch (error) {
    console.error('Error in AI prediction:', error);
    console.error('API Key verification failed. Check if the key is valid and has proper permissions.');
    if (error.response) {
      console.error('API Error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    throw new Error(`AI prediction failed: ${error.message}`);
  }
};

// Helper function to create a prompt for the AI model
function createAiPrompt(assessmentData) {
  let prompt = `Analyze the following patient's neuromotor assessment data and provide an analysis of potential neurological disorders. Focus on identifying signs of Parkinson's disease, Bell's Palsy, and ALS.

For each potential disorder, provide:
1. A risk score (low, moderate, or high)
2. Specific indicators from the data that support your assessment
3. Recommendations for further clinical evaluation

Here is the patient's assessment data:\n\n`;

  // Add tremor data if available
  if (assessmentData.tremor) {
    prompt += `TREMOR ASSESSMENT (Date: ${new Date(assessmentData.tremor.timestamp).toLocaleDateString()}):
- Frequency: ${assessmentData.tremor.metrics?.tremor_frequency || assessmentData.tremor.metrics?.frequency || 'N/A'} Hz
- Amplitude: ${assessmentData.tremor.metrics?.tremor_amplitude || assessmentData.tremor.metrics?.amplitude || 'N/A'}
- Type: ${assessmentData.tremor.metrics?.tremor_type || assessmentData.tremor.metrics?.type || 'N/A'}
- Severity: ${assessmentData.tremor.metrics?.severity || 'N/A'}
- Overall Tremor Score: ${assessmentData.tremor.metrics?.overall?.tremorScore || assessmentData.tremor.metrics?.overallScore || 'N/A'}/10

`;
  } else {
    prompt += `TREMOR ASSESSMENT: No data available\n\n`;
  }

  // Add speech pattern data if available
  if (assessmentData.speech) {
    prompt += `SPEECH PATTERN ASSESSMENT (Date: ${new Date(assessmentData.speech.timestamp).toLocaleDateString()}):
- Clarity: ${assessmentData.speech.metrics?.clarity?.score || assessmentData.speech.metrics?.clarity || 'N/A'}/10
- Speech Rate: ${assessmentData.speech.metrics?.speechRate?.wordsPerMinute || assessmentData.speech.metrics?.speechRate || 'N/A'} words per minute
- Volume Control: ${assessmentData.speech.metrics?.volumeControl?.score || assessmentData.speech.metrics?.volumeControl || 'N/A'}/10
- Overall Score: ${assessmentData.speech.metrics?.overallScore || assessmentData.speech.metrics?.overallQuality || 'N/A'}/10
${assessmentData.speech.metrics?.emotion ? `
- Confidence: ${assessmentData.speech.metrics.emotion.confidence || 'N/A'}/10
- Hesitation: ${assessmentData.speech.metrics.emotion.hesitation || 'N/A'}/10
- Stress: ${assessmentData.speech.metrics.emotion.stress || 'N/A'}/10
- Monotony: ${assessmentData.speech.metrics.emotion.monotony || 'N/A'}/10\n` : ''}

`;
  } else {
    prompt += `SPEECH PATTERN ASSESSMENT: No data available\n\n`;
  }

  // Add response time data if available
  if (assessmentData.responseTime) {
    prompt += `RESPONSE TIME ASSESSMENT (Date: ${new Date(assessmentData.responseTime.timestamp).toLocaleDateString()}):
- Average Response Time: ${assessmentData.responseTime.metrics?.averageResponseTime || 'N/A'} ms
- Fastest Response: ${assessmentData.responseTime.metrics?.fastestResponse || 'N/A'} ms
- Slowest Response: ${assessmentData.responseTime.metrics?.slowestResponse || 'N/A'} ms
- Accuracy: ${assessmentData.responseTime.metrics?.accuracy || 'N/A'}/10
- Response Score: ${assessmentData.responseTime.metrics?.overall?.responseScore || 'N/A'}/10

`;
  } else {
    prompt += `RESPONSE TIME ASSESSMENT: No data available\n\n`;
  }
  
  // Add facial symmetry data if available
  if (assessmentData.facialSymmetry) {
    prompt += `FACIAL SYMMETRY ASSESSMENT (Date: ${new Date(assessmentData.facialSymmetry.timestamp).toLocaleDateString()}):
- Symmetry Score: ${assessmentData.facialSymmetry.metrics?.symmetryScore || assessmentData.facialSymmetry.metrics?.symmetry_score || 'N/A'}/100
- Eye Symmetry: ${assessmentData.facialSymmetry.metrics?.eye_symmetry || assessmentData.facialSymmetry.metrics?.eyeSymmetry || 'N/A'}/10
- Mouth Symmetry: ${assessmentData.facialSymmetry.metrics?.mouth_symmetry || assessmentData.facialSymmetry.metrics?.mouthSymmetry || 'N/A'}/10
- Jaw Symmetry: ${assessmentData.facialSymmetry.metrics?.jaw_symmetry || assessmentData.facialSymmetry.metrics?.jawSymmetry || 'N/A'}/10
- Face Tilt: ${assessmentData.facialSymmetry.metrics?.face_tilt || assessmentData.facialSymmetry.metrics?.faceTilt || 'N/A'} degrees
`;

    // Add neurological indicators if available
    if (assessmentData.facialSymmetry.metrics?.neurological_indicators || 
        assessmentData.facialSymmetry.neurological_indicators) {
      
      const indicators = assessmentData.facialSymmetry.metrics?.neurological_indicators || 
                        assessmentData.facialSymmetry.neurological_indicators;
      
      prompt += `
- Bell's Palsy Risk: ${indicators?.bells_palsy?.risk || 'Unknown'}
- Bell's Palsy Score: ${indicators?.bells_palsy?.score || 'N/A'}
- Stroke Risk: ${indicators?.stroke?.risk || 'Unknown'}
- Parkinson's Risk: ${indicators?.parkinsons?.risk || 'Unknown'}
- Overall Neurological Risk: ${indicators?.overall?.risk || 'Unknown'}
`;
    }

    prompt += `\n`;
  } else {
    prompt += `FACIAL SYMMETRY ASSESSMENT: No data available\n\n`;
  }

  // Add finger tapping data if available
  if (assessmentData.fingerTapping) {
    prompt += `FINGER TAPPING ASSESSMENT (Date: ${new Date(assessmentData.fingerTapping.timestamp).toLocaleDateString()}):
- Frequency: ${assessmentData.fingerTapping.metrics?.frequency || assessmentData.fingerTapping.metrics?.tapsPerSecond || 'N/A'} taps/second
- Amplitude: ${assessmentData.fingerTapping.metrics?.amplitude || 'N/A'}
- Rhythm: ${assessmentData.fingerTapping.metrics?.rhythm || assessmentData.fingerTapping.metrics?.rhythmScore || 'N/A'}/10
- Accuracy: ${assessmentData.fingerTapping.metrics?.accuracy || 'N/A'}/10
- Overall Score: ${assessmentData.fingerTapping.metrics?.overallScore || 'N/A'}/10

`;
  } else {
    prompt += `FINGER TAPPING ASSESSMENT: No data available\n\n`;
  }

  // Add eye movement data if available
  if (assessmentData.eyeMovement) {
    prompt += `EYE MOVEMENT ASSESSMENT (Date: ${new Date(assessmentData.eyeMovement.timestamp).toLocaleDateString()}):
- Tracking Accuracy: ${assessmentData.eyeMovement.metrics?.accuracy || assessmentData.eyeMovement.metrics?.trackingAccuracy || 'N/A'}/10
- Saccade Speed: ${assessmentData.eyeMovement.metrics?.speed || assessmentData.eyeMovement.metrics?.saccadeSpeed || 'N/A'}/10
- Fixation Stability: ${assessmentData.eyeMovement.metrics?.stability || assessmentData.eyeMovement.metrics?.fixationStability || 'N/A'}/10
- Smoothness: ${assessmentData.eyeMovement.metrics?.smoothness || 'N/A'}/10
- Overall Score: ${assessmentData.eyeMovement.metrics?.overallScore || 'N/A'}/10

`;
  } else {
    prompt += `EYE MOVEMENT ASSESSMENT: No data available\n\n`;
  }

  // Add gait analysis data if available
  if (assessmentData.gaitAnalysis) {
    prompt += `GAIT ANALYSIS ASSESSMENT (Date: ${new Date(assessmentData.gaitAnalysis.timestamp).toLocaleDateString()}):
- Stability: ${assessmentData.gaitAnalysis.metrics?.stability || 'N/A'}/10
- Balance: ${assessmentData.gaitAnalysis.metrics?.balance || 'N/A'}/10
- Symmetry: ${assessmentData.gaitAnalysis.metrics?.symmetry || 'N/A'}/10
- Step Length: ${assessmentData.gaitAnalysis.metrics?.stepLength || 'N/A'} cm
- Walking Speed: ${assessmentData.gaitAnalysis.metrics?.walkingSpeed || 'N/A'} m/s
- Overall Score: ${assessmentData.gaitAnalysis.metrics?.overallScore || 'N/A'}/10

`;
  } else {
    prompt += `GAIT ANALYSIS ASSESSMENT: No data available\n\n`;
  }

  // Add neck mobility data if available
  if (assessmentData.neckMobility) {
    prompt += `NECK MOBILITY ASSESSMENT (Date: ${new Date(assessmentData.neckMobility.timestamp).toLocaleDateString()}):
- Flexion: ${assessmentData.neckMobility.metrics?.flexion || 'N/A'} degrees
- Extension: ${assessmentData.neckMobility.metrics?.extension || 'N/A'} degrees
- Lateral Rotation: ${assessmentData.neckMobility.metrics?.lateralRotation || assessmentData.neckMobility.metrics?.rotation || 'N/A'} degrees
- Lateral Bending: ${assessmentData.neckMobility.metrics?.lateralBending || 'N/A'} degrees
- Range of Motion: ${assessmentData.neckMobility.metrics?.rangeOfMotion || 'N/A'}/10
- Overall Score: ${assessmentData.neckMobility.metrics?.overallScore || 'N/A'}/10

`;
  } else {
    prompt += `NECK MOBILITY ASSESSMENT: No data available\n\n`;
  }

  // Add specific JSON formatting instruction
  prompt += `IMPORTANT: Your response MUST be a valid JSON object without any additional text, explanations, or markdown. Format your response as follows, replacing placeholders with your analysis:

{
  "parkinsonsDisease": {
    "riskLevel": "low|moderate|high",
    "confidence": 0-100,
    "indicators": ["indicator 1", "indicator 2"],
    "recommendations": ["recommendation 1", "recommendation 2"]
  },
  "bellsPalsy": {
    "riskLevel": "low|moderate|high",
    "confidence": 0-100,
    "indicators": ["indicator 1", "indicator 2"],
    "recommendations": ["recommendation 1", "recommendation 2"]
  },
  "als": {
    "riskLevel": "low|moderate|high",
    "confidence": 0-100,
    "indicators": ["indicator 1", "indicator 2"],
    "recommendations": ["recommendation 1", "recommendation 2"]
  },
  "overallAssessment": "Your overall assessment summary based on all provided assessments",
  "disclaimerNote": "This is an automated AI analysis and should not replace professional medical diagnosis."
}

DO NOT include any explanatory text outside the JSON. The entire response should be valid JSON that can be parsed directly.`;

  console.log('Generated AI prompt with length:', prompt.length);
  return prompt;
}

// Helper function to parse the AI response
function parseAiResponse(text) {
  try {
    // First attempt: Try to parse the entire response as JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      console.log('Could not parse entire response as JSON, trying extraction...');
    }
    
    // Second attempt: Extract JSON with improved regex patterns
    const patterns = [
      /\{[\s\S]*\}/g,                   // Standard JSON object pattern
      /\{[\s\S]*"disclaimerNote"[\s\S]*\}/g, // Look for specific field
      /\{\s*"parkinsonsDisease"[\s\S]*\}/g   // Look for starting field
    ];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const jsonStr = matches[0];
        try {
          console.log('Found JSON structure using pattern:', pattern);
          return JSON.parse(jsonStr);
        } catch (e) {
          console.log(`Extraction found, but parsing failed for pattern ${pattern}:`, e.message);
        }
      }
    }
    
    // Third attempt: Try to reconstruct the JSON from the text
    console.log('Attempting to reconstruct JSON from text...');
    const reconstructedJson = reconstructJsonFromText(text);
    if (reconstructedJson) {
      return reconstructedJson;
    }
    
    console.warn('Could not extract JSON from AI response, using fallback format');
    console.log('First 500 chars of response:', text.substring(0, 500));
    
    // If all attempts fail, return a basic structure
    return {
      parkinsonsDisease: { 
        riskLevel: extractRiskLevel(text, "parkinson"),
        indicators: extractBulletPoints(text, "parkinson", "indicator"), 
        recommendations: extractBulletPoints(text, "parkinson", "recommend")
      },
      bellsPalsy: { 
        riskLevel: extractRiskLevel(text, "bell"),
        indicators: extractBulletPoints(text, "bell", "indicator"), 
        recommendations: extractBulletPoints(text, "bell", "recommend")
      },
      als: { 
        riskLevel: extractRiskLevel(text, "als"),
        indicators: extractBulletPoints(text, "als", "indicator"), 
        recommendations: extractBulletPoints(text, "als", "recommend")  
      },
      overallAssessment: extractOverallAssessment(text),
      disclaimerNote: "This is an automated AI analysis and should not replace professional medical diagnosis."
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {
      error: "Failed to parse AI response",
      rawText: text
    };
  }
}

// Helper function to reconstruct JSON from text
function reconstructJsonFromText(text) {
  try {
    const result = {
      parkinsonsDisease: { riskLevel: "unknown", indicators: [], recommendations: [] },
      bellsPalsy: { riskLevel: "unknown", indicators: [], recommendations: [] },
      als: { riskLevel: "unknown", indicators: [], recommendations: [] },
      overallAssessment: "",
      disclaimerNote: "This is an automated AI analysis and should not replace professional medical diagnosis."
    };
    
    // Extract Parkinson's section
    const parkinsonsMatch = text.match(/parkinson['s]* disease[^]*?risk[^]*?(low|moderate|high)/i);
    if (parkinsonsMatch) {
      result.parkinsonsDisease.riskLevel = parkinsonsMatch[1].toLowerCase();
      
      // Extract confidence
      const confidenceMatch = text.match(/parkinson['s]* disease[^]*?confidence:?\s*(\d+)/i);
      if (confidenceMatch) {
        result.parkinsonsDisease.confidence = parseInt(confidenceMatch[1]);
      }
    }

    // Extract Bell's Palsy section
    const bellsPalsyMatch = text.match(/bell['s]* palsy[^]*?risk[^]*?(low|moderate|high)/i);
    if (bellsPalsyMatch) {
      result.bellsPalsy.riskLevel = bellsPalsyMatch[1].toLowerCase();
      
      // Extract confidence
      const confidenceMatch = text.match(/bell['s]* palsy[^]*?confidence:?\s*(\d+)/i);
      if (confidenceMatch) {
        result.bellsPalsy.confidence = parseInt(confidenceMatch[1]);
      }
    }

    // Extract ALS section
    const alsMatch = text.match(/als[^]*?risk[^]*?(low|moderate|high)/i);
    if (alsMatch) {
      result.als.riskLevel = alsMatch[1].toLowerCase();
      
      // Extract confidence
      const confidenceMatch = text.match(/als[^]*?confidence:?\s*(\d+)/i);
      if (confidenceMatch) {
        result.als.confidence = parseInt(confidenceMatch[1]);
      }
    }

    // Extract overall assessment
    const overallMatch = text.match(/overall assessment:?\s*([^]*?)(?:disclaimer|$)/i);
    if (overallMatch) {
      result.overallAssessment = overallMatch[1].trim();
    }
    
    // Extract indicators and recommendations using separate function
    result.parkinsonsDisease.indicators = extractBulletPoints(text, "parkinson", "indicator");
    result.parkinsonsDisease.recommendations = extractBulletPoints(text, "parkinson", "recommend");
    result.bellsPalsy.indicators = extractBulletPoints(text, "bell", "indicator");
    result.bellsPalsy.recommendations = extractBulletPoints(text, "bell", "recommend");
    result.als.indicators = extractBulletPoints(text, "als", "indicator");
    result.als.recommendations = extractBulletPoints(text, "als", "recommend");
    
    return result;
  } catch (error) {
    console.error("Error reconstructing JSON:", error);
    return null;
  }
}

// Helper function to extract bullet points
function extractBulletPoints(text, disorderKeyword, type) {
  try {
    const sectionRegex = new RegExp(`${disorderKeyword}[^]*?${type}[^]*?([^]*)(?:recommend|risk|confidence|${disorderKeyword === 'als' ? 'overall' : 'als'}|${disorderKeyword === 'bell' ? 'overall' : 'bell'}|${disorderKeyword === 'parkinson' ? 'overall' : 'parkinson'}|$)`, 'i');
    const section = text.match(sectionRegex);
    
    if (section && section[1]) {
      // Extract each bullet point
      const bulletPoints = [];
      const bulletRegex = /(?:-|\*|\d+\.|\•)\s*([^\n]+)/g;
      const bulletText = section[1];
      
      let match;
      while ((match = bulletRegex.exec(bulletText)) !== null) {
        if (match[1] && match[1].trim()) {
          bulletPoints.push(match[1].trim());
        }
      }
      
      // If no bullet points found using markers, try splitting by newlines
      if (bulletPoints.length === 0) {
        return bulletText.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.toLowerCase().includes(type.toLowerCase()) && line.length > 3);
      }
      
      return bulletPoints;
    }
    return [];
  } catch (error) {
    console.log(`Error extracting ${type} for ${disorderKeyword}:`, error);
    return [];
  }
}

// Helper function to extract risk level
function extractRiskLevel(text, disorderKeyword) {
  try {
    const riskMatch = new RegExp(`${disorderKeyword}[^]*?risk[^]*?(low|moderate|high)`, 'i');
    const match = text.match(riskMatch);
    return match ? match[1].toLowerCase() : "unknown";
  } catch (error) {
    return "unknown";
  }
}

// Helper function to extract overall assessment
function extractOverallAssessment(text) {
  try {
    // Look for an overall assessment section
    const overallMatch = text.match(/overall assessment:?\s*([^]*?)(?:disclaimer|$)/i);
    if (overallMatch && overallMatch[1]) {
      return overallMatch[1].trim();
    }
    
    // If no explicit section, look for a summary
    const summaryMatch = text.match(/summary:?\s*([^]*?)(?:disclaimer|$)/i);
    if (summaryMatch && summaryMatch[1]) {
      return summaryMatch[1].trim();
    }
    
    return "Based on the assessment data, no clear overall assessment could be extracted.";
  } catch (error) {
    return "Based on the assessment data, no clear overall assessment could be extracted.";
  }
}

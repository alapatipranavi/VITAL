import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// Validate API key on initialization
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not defined in environment variables');
  throw new Error('GEMINI_API_KEY is required');
}

if (process.env.GEMINI_API_KEY.length < 20) {
  console.warn('⚠️ GEMINI_API_KEY appears to be invalid (too short)');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extract biomarkers from uploaded image/PDF using Gemini Vision
 */
export const extractBiomarkers = async (filePath, mimeType) => {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    // Validate mime type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Read file as base64
    const fileData = fs.readFileSync(filePath);
    
    // Check file size (max 20MB for Gemini)
    const fileSizeMB = fileData.length / (1024 * 1024);
    if (fileSizeMB > 20) {
      throw new Error(`File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum limit of 20MB`);
    }

    const base64Data = fileData.toString('base64');

    const prompt = `You are a medical lab report analyzer. Extract all biomarker test results from this lab report image/PDF.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "testName": "HbA1c",
    "value": 6.2,
    "unit": "%",
    "referenceRange": "4.0 - 5.6"
  }
]

Rules:
1. Extract ALL test results visible in the report
2. testName: Use standard medical abbreviations (e.g., "HbA1c", "HDL", "LDL", "Total Cholesterol", "Triglycerides", "Glucose", "Creatinine", "Hemoglobin")
3. value: Extract the numeric value only
4. unit: Extract the unit (%, mg/dL, g/dL, mmol/L, etc.)
5. referenceRange: Extract the reference/normal range as a string (e.g., "4.0 - 5.6" or "< 5.6" or "> 4.0")
6. If a value is missing or unclear, skip that test
7. Return ONLY the JSON array, no additional text

JSON array:`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    let text = response.text();

    // Clean the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to extract JSON array
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const biomarkers = JSON.parse(jsonMatch[0]);
      return biomarkers;
    }

    throw new Error('Failed to extract valid JSON from Gemini response');
  } catch (error) {
    console.error('Gemini extraction error:', error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY in the .env file.');
    }
    
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new Error('Gemini API quota exceeded. Please check your API usage limits.');
    }
    
    if (error.message?.includes('safety')) {
      throw new Error('Content was blocked by safety filters. Please try a different image.');
    }
    
    throw new Error(`Biomarker extraction failed: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Generate explanation using Gemini text model
 */
export const generateExplanation = async (biomarker, ragContext, userProfile) => {
  try {
    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a medical information assistant. Provide a clear, simple explanation about this biomarker result.

Biomarker: ${biomarker.testName}
Value: ${biomarker.value} ${biomarker.unit}
Reference Range: ${biomarker.referenceRange}
Status: ${biomarker.status}

Relevant Medical Context:
${ragContext.biomarkerInfo || 'No specific context available'}

Nutrition & Lifestyle Context:
${ragContext.nutritionInfo || 'No specific context available'}

User Profile:
- Age: ${userProfile.age || 'Not specified'}
- Gender: ${userProfile.gender || 'Not specified'}
- Diet Preference: ${userProfile.dietPreference || 'Not specified'}

Provide:
1. Simple explanation (2-3 sentences) of what this biomarker means
2. Why the value might be ${biomarker.status.toLowerCase()}
3. Dietary suggestions (considering user's diet preference: ${userProfile.dietPreference || 'none'})
4. Lifestyle recommendations (2-3 actionable items)

Format as JSON:
{
  "explanation": "...",
  "dietarySuggestions": ["...", "..."],
  "lifestyleRecommendations": ["...", "..."]
}

IMPORTANT: Include this disclaimer at the end: "This is not a medical prescription. Consult a doctor."`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Extract JSON if wrapped in markdown
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback: return structured text
    return {
      explanation: text,
      dietarySuggestions: [],
      lifestyleRecommendations: []
    };
  } catch (error) {
    console.error('Gemini explanation error:', error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY in the .env file.');
    }
    
    // Return fallback explanation instead of throwing
    return {
      explanation: `This biomarker (${biomarker.testName}) has a ${biomarker.status} value of ${biomarker.value} ${biomarker.unit}. Please consult with a healthcare provider for detailed interpretation.`,
      dietarySuggestions: ['Maintain a balanced diet', 'Stay hydrated', 'Follow your healthcare provider\'s recommendations'],
      lifestyleRecommendations: ['Regular exercise', 'Adequate sleep', 'Stress management']
    };
  }
};

/**
 * Generate doctor-ready summary
 */
export const generateDoctorSummary = async (reports, abnormalBiomarkers) => {
  try {
    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Generate a concise, doctor-ready summary from these lab reports.

Reports Summary:
${JSON.stringify(reports, null, 2)}

Abnormal Biomarkers:
${JSON.stringify(abnormalBiomarkers, null, 2)}

Generate exactly 5 bullet points:
1. Persistent deficiencies or chronic issues
2. Improving markers (if any)
3. Critical alerts requiring immediate attention
4. Potential supplement or medication interactions
5. Recommended consultation focus

Format as JSON array:
["bullet point 1", "bullet point 2", ...]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [
      'Review all abnormal biomarkers',
      'Monitor trends over time',
      'Consider lifestyle modifications',
      'Evaluate medication interactions',
      'Schedule follow-up consultation'
    ];
  } catch (error) {
    console.error('Doctor summary error:', error);
    return [
      'Review all abnormal biomarkers',
      'Monitor trends over time',
      'Consider lifestyle modifications',
      'Evaluate medication interactions',
      'Schedule follow-up consultation'
    ];
  }
};


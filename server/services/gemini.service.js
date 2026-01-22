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

    const prompt = `You are a medical lab report analyzer. Extract ALL biomarker test results from this lab report image/PDF.

CRITICAL INSTRUCTIONS:
- Extract EVERY test result visible in the report
- Be precise with values, units, and reference ranges
- Handle missing data gracefully

Return ONLY a valid JSON array with this exact structure:
[
  {
    "testName": "HbA1c",
    "value": 6.2,
    "unit": "%",
    "referenceRange": "4.0 - 5.6"
  }
]

EXTRACTION RULES:
1. testName: Use standard medical abbreviations/exact names from report
   - Examples: "HbA1c", "HDL", "LDL", "Total Cholesterol", "Triglycerides", "Glucose", "Creatinine", "Hemoglobin", "Urea", "AST", "ALT", "Bilirubin", "TSH", "T3", "T4", "Vitamin D", "B12", "Folate", "Iron", "Ferritin"
   - Preserve exact spelling from report if standard abbreviation unclear

2. value: Extract the NUMERIC value only
   - Must be a number (integer or decimal)
   - If value is non-numeric or unclear, set to null and include in array with note
   - Handle ranges (e.g., "5.2-6.8" → use first value or average)

3. unit: Extract the unit exactly as shown
   - Common: "%", "mg/dL", "g/dL", "mmol/L", "IU/L", "U/L", "ng/mL", "pg/mL", "mIU/L"
   - If unit missing, use "N/A" or most common unit for that test
   - Normalize variations: "mg/dl" → "mg/dL", "g/dl" → "g/dL"

4. referenceRange: Extract reference/normal range as string
   - Format: "low - high" (e.g., "4.0 - 5.6")
   - Or single threshold: "< 5.6" or "> 4.0"
   - If range missing, use "N/A" or common range for that test
   - Handle formats: "4.0-5.6", "4.0 to 5.6", "4.0–5.6" → normalize to "4.0 - 5.6"

5. Edge Cases:
   - Missing reference range: Use "N/A"
   - Unclear units: Use most common unit for that test type
   - Non-numeric values: Set value to null, still include in array
   - Multiple values for same test: Include all as separate entries

6. Output: Return ONLY the JSON array, no markdown, no explanations, no additional text

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

    const prompt = `You are a wellness information assistant. Provide clear, simple, wellness-focused guidance about this biomarker result.

Biomarker: ${biomarker.testName}
Value: ${biomarker.value} ${biomarker.unit}
Reference Range: ${biomarker.referenceRange}
Status: ${biomarker.status}

Relevant Context:
${ragContext.biomarkerInfo || 'No specific context available'}

Nutrition & Lifestyle Context:
${ragContext.nutritionInfo || 'No specific context available'}

User Profile:
- Age: ${userProfile.age || 'Not specified'}
- Gender: ${userProfile.gender || 'Not specified'}
- Diet Preference: ${userProfile.dietPreference || 'Not specified'}

INSTRUCTIONS:
- Use simple, non-medical language
- Focus on wellness and lifestyle, NOT medical diagnosis or treatment
- Be encouraging and actionable
- Avoid prescription-style language
- Keep explanations brief and clear

Provide:
1. Simple explanation (2-3 sentences) of what this biomarker means in everyday terms
2. Why the value might be ${biomarker.status.toLowerCase()} (simple, non-medical reasons)
3. Dietary suggestions (2-3 items, considering user's diet preference: ${userProfile.dietPreference || 'none'})
4. Lifestyle recommendations (2-3 actionable wellness items)

Format as JSON:
{
  "explanation": "...",
  "dietarySuggestions": ["...", "..."],
  "lifestyleRecommendations": ["...", "..."]
}

CRITICAL: This is wellness guidance only, not medical advice. Keep language simple and wellness-focused.`;

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

    const prompt = `Generate a concise, professional doctor-ready summary from these lab reports.

Reports Summary:
${JSON.stringify(reports, null, 2)}

Abnormal Biomarkers:
${JSON.stringify(abnormalBiomarkers, null, 2)}

Generate exactly 5 professional bullet points:
1. Persistent abnormalities or chronic patterns (mention specific biomarkers if notable)
2. Improving trends (if any biomarkers show positive changes)
3. Critical alerts requiring immediate medical attention (if any)
4. Potential considerations for medication or supplement review
5. Recommended consultation focus areas

Requirements:
- Be professional and concise
- Use medical terminology appropriately
- Focus on actionable insights
- Highlight trends and patterns
- Keep each point to 1-2 sentences maximum

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


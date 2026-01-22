import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Pinecone
let pineconeClient = null;
let pineconeIndex = null;

const initializePinecone = async () => {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    pineconeIndex = pineconeClient.index(process.env.PINECONE_INDEX);
  }
  return pineconeIndex;
};

/**
 * Generate embedding using Gemini
 * Note: For production, use a dedicated embedding service like OpenAI embeddings
 * or Google's text-embedding models. This is a placeholder implementation.
 */
const generateEmbedding = async (text) => {
  try {
    // Placeholder: In production, use actual embedding API
    // For now, return a simple representation
    // You can integrate with OpenAI embeddings or other services
    return text.toLowerCase().split(/\s+/);
  } catch (error) {
    console.error('Embedding generation error:', error);
    return [];
  }
};

/**
 * Query Pinecone for relevant context
 */
export const queryRAG = async (biomarkerName, namespace = 'biomarkers') => {
  try {
    const index = await initializePinecone();
    
    // For now, use keyword-based search
    // In production, use proper vector embeddings
    const queryText = biomarkerName.toLowerCase();
    
    // Query Pinecone (this is a simplified version)
    // In production, you would:
    // 1. Generate embedding for queryText
    // 2. Query Pinecone with that embedding
    // 3. Retrieve top-k results
    
    // For demo purposes, return sample context
    // Replace this with actual Pinecone queries once embeddings are set up
    const sampleContext = getSampleContext(biomarkerName);
    
    return sampleContext;
  } catch (error) {
    console.error('Pinecone query error:', error);
    return {
      biomarkerInfo: `Information about ${biomarkerName}`,
      nutritionInfo: `General nutrition guidelines for ${biomarkerName}`
    };
  }
};

/**
 * Sample context data (replace with actual Pinecone data)
 */
const getSampleContext = (biomarkerName) => {
  const contextMap = {
    'hba1c': {
      biomarkerInfo: 'HbA1c (Hemoglobin A1c) measures average blood sugar over 2-3 months. Normal range is 4.0-5.6%. Higher values indicate diabetes risk.',
      nutritionInfo: 'For high HbA1c: Reduce refined carbs, increase fiber, choose low-glycemic foods. Include whole grains, vegetables, lean proteins.'
    },
    'hdl': {
      biomarkerInfo: 'HDL (High-Density Lipoprotein) is "good cholesterol" that helps remove LDL. Higher values (above 40 mg/dL for men, 50 for women) are better.',
      nutritionInfo: 'To raise HDL: Include healthy fats (olive oil, avocados, nuts), omega-3 fatty acids, regular exercise, moderate alcohol (if appropriate).'
    },
    'ldl': {
      biomarkerInfo: 'LDL (Low-Density Lipoprotein) is "bad cholesterol" that can build up in arteries. Optimal is below 100 mg/dL.',
      nutritionInfo: 'To lower LDL: Reduce saturated and trans fats, increase soluble fiber (oats, beans), include plant sterols, limit processed foods.'
    },
    'glucose': {
      biomarkerInfo: 'Glucose measures blood sugar at the time of test. Normal fasting is 70-100 mg/dL. High values indicate diabetes risk.',
      nutritionInfo: 'For high glucose: Eat balanced meals, avoid sugary drinks, include protein with carbs, maintain regular meal timing.'
    },
    'creatinine': {
      biomarkerInfo: 'Creatinine measures kidney function. Normal range varies by age/gender. High values may indicate kidney issues.',
      nutritionInfo: 'For high creatinine: Stay hydrated, reduce protein if advised, limit sodium, avoid nephrotoxic substances, consult nephrologist.'
    }
  };

  const key = biomarkerName.toLowerCase().replace(/\s+/g, '');
  return contextMap[key] || {
    biomarkerInfo: `${biomarkerName} is a biomarker that should be interpreted by a healthcare professional.`,
    nutritionInfo: `General healthy eating and lifestyle modifications may help optimize ${biomarkerName} levels.`
  };
};

/**
 * Initialize Pinecone with sample data (run once for setup)
 */
export const initializePineconeData = async () => {
  try {
    const index = await initializePinecone();
    console.log('✅ Pinecone initialized');
    // In production, you would upsert embeddings here
    return true;
  } catch (error) {
    console.error('❌ Pinecone initialization error:', error);
    return false;
  }
};


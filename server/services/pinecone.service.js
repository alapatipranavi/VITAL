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
 * Generate query embedding (simple fallback - same as ingestion script)
 */
function generateQueryEmbedding(text) {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  const embedding = new Array(1536).fill(0);
  const wordFreq = {};
  
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  Object.entries(wordFreq).forEach(([word, freq]) => {
    for (let seed = 0; seed < 3; seed++) {
      let hash = seed;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
        hash = hash & hash;
      }
      const index = Math.abs(hash) % 1536;
      embedding[index] += freq / (seed + 1);
    }
  });
  
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + '_' + words[i + 1];
    let hash = 0;
    for (let j = 0; j < bigram.length; j++) {
      hash = ((hash << 5) - hash) + bigram.charCodeAt(j);
      hash = hash & hash;
    }
    const index = Math.abs(hash) % 1536;
    embedding[index] += 0.5;
  }
  
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return embedding.map(val => val / magnitude);
  }
  return embedding.map(() => (Math.random() - 0.5) * 0.01);
}

/**
 * Query Pinecone for relevant context
 */
export const queryRAG = async (biomarkerName, namespace = 'biomarkers') => {
  try {
    const index = await initializePinecone();
    const queryText = biomarkerName.toLowerCase();
    
    // Generate query embedding
    const queryEmbedding = generateQueryEmbedding(queryText);
    
    // Query biomarkers namespace
    let biomarkerInfo = '';
    try {
      const biomarkerResponse = await index.namespace('biomarkers').query({
        vector: queryEmbedding,
        topK: 3,
        includeMetadata: true
      });
      
      if (biomarkerResponse.matches && biomarkerResponse.matches.length > 0) {
        biomarkerInfo = biomarkerResponse.matches
          .map(match => match.metadata?.text || '')
          .filter(text => text.length > 0)
          .join(' ');
      }
    } catch (err) {
      console.warn('Error querying biomarkers namespace:', err.message);
    }
    
    // Query nutrition guidelines namespace
    let nutritionInfo = '';
    try {
      const nutritionResponse = await index.namespace('nutrition_guidelines').query({
        vector: queryEmbedding,
        topK: 2,
        includeMetadata: true
      });
      
      if (nutritionResponse.matches && nutritionResponse.matches.length > 0) {
        nutritionInfo = nutritionResponse.matches
          .map(match => match.metadata?.text || '')
          .filter(text => text.length > 0)
          .join(' ');
      }
    } catch (err) {
      console.warn('Error querying nutrition_guidelines namespace:', err.message);
    }
    
    // Return results or fallback
    if (biomarkerInfo || nutritionInfo) {
      return {
        biomarkerInfo: biomarkerInfo || `Information about ${biomarkerName}`,
        nutritionInfo: nutritionInfo || `General nutrition guidelines for ${biomarkerName}`
      };
    }
    
    // Fallback to sample context if no results
    return getSampleContext(biomarkerName);
  } catch (error) {
    console.error('Pinecone query error:', error);
    // Fallback to sample context on error
    return getSampleContext(biomarkerName);
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


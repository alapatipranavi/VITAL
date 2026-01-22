/**
 * Pinecone Data Ingestion Script
 * 
 * This script populates Pinecone with biomarker definitions and nutrition guidelines.
 * 
 * Run with: node scripts/ingestPinecone.js
 */

import '../env.js';
import { Pinecone } from '@pinecone-database/pinecone';

// Optional: Initialize OpenAI for embeddings (if API key is provided)
let openai = null;

async function initializeOpenAI() {
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiModule = await import('openai');
      const OpenAI = openaiModule.default || openaiModule.OpenAI;
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('✅ Using OpenAI embeddings');
      return true;
    } catch (error) {
      console.warn('⚠️  OpenAI package not installed, using fallback embeddings');
      console.warn('   Install with: npm install openai');
      return false;
    }
  } else {
    console.log('ℹ️  No OPENAI_API_KEY found, using fallback embeddings');
    return false;
  }
}

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const indexName = process.env.PINECONE_INDEX || 'vitalsense';
const index = pinecone.index(indexName);

// Embedding dimension (OpenAI text-embedding-3-small uses 1536)
const EMBEDDING_DIMENSION = 1536;

/**
 * Generate embeddings using OpenAI or fallback method
 */
async function generateEmbedding(text) {
  try {
    // Try OpenAI first if available
    if (openai) {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
      });
      return response.data[0].embedding;
    }
    
    // Fallback: Improved hash-based embedding
    return generateFallbackEmbedding(text);
  } catch (error) {
    console.error('Embedding generation error:', error.message);
    // Fallback to simple embedding
    return generateFallbackEmbedding(text);
  }
}

/**
 * Fallback embedding (improved hash-based)
 * For production, use OpenAI embeddings or another embedding service for better results.
 */
function generateFallbackEmbedding(text) {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  const embedding = new Array(EMBEDDING_DIMENSION).fill(0);
  const wordFreq = {};
  
  // Calculate word frequencies
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // Create embedding based on word hashes and frequencies
  Object.entries(wordFreq).forEach(([word, freq]) => {
    // Create multiple hash values for each word
    for (let seed = 0; seed < 3; seed++) {
      let hash = seed;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
        hash = hash & hash;
      }
      const index = Math.abs(hash) % EMBEDDING_DIMENSION;
      embedding[index] += freq / (seed + 1);
    }
  });
  
  // Add n-gram features (bigrams)
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + '_' + words[i + 1];
    let hash = 0;
    for (let j = 0; j < bigram.length; j++) {
      hash = ((hash << 5) - hash) + bigram.charCodeAt(j);
      hash = hash & hash;
    }
    const index = Math.abs(hash) % EMBEDDING_DIMENSION;
    embedding[index] += 0.5;
  }
  
  // Normalize to unit vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return embedding.map(val => val / magnitude);
  }
  
  // If all zeros, return small random values
  return embedding.map(() => (Math.random() - 0.5) * 0.01);
}

/**
 * Biomarker definitions data
 */
const biomarkerData = [
  {
    id: 'hba1c_definition',
    text: 'HbA1c (Hemoglobin A1c) measures average blood sugar levels over the past 2-3 months. Normal range is 4.0-5.6%. Values between 5.7-6.4% indicate prediabetes. Values above 6.5% indicate diabetes. Higher HbA1c increases risk of diabetes complications.',
    category: 'definition'
  },
  {
    id: 'hba1c_high_causes',
    text: 'High HbA1c causes include: uncontrolled diabetes, insulin resistance, poor diet high in refined sugars, lack of physical activity, certain medications, stress, illness, and genetic factors. Chronic high blood sugar damages blood vessels and organs.',
    category: 'causes'
  },
  {
    id: 'hdl_definition',
    text: 'HDL (High-Density Lipoprotein) is known as "good cholesterol" because it helps remove LDL cholesterol from arteries. Higher HDL levels are better. Normal ranges: Men >40 mg/dL, Women >50 mg/dL. HDL protects against heart disease.',
    category: 'definition'
  },
  {
    id: 'hdl_low_causes',
    text: 'Low HDL causes include: sedentary lifestyle, smoking, obesity, type 2 diabetes, genetic factors, certain medications (beta-blockers, anabolic steroids), and diets high in trans fats and refined carbohydrates.',
    category: 'causes'
  },
  {
    id: 'ldl_definition',
    text: 'LDL (Low-Density Lipoprotein) is "bad cholesterol" that can build up in artery walls, forming plaques. Optimal LDL is below 100 mg/dL. Values 100-129 mg/dL are near optimal. Values above 130 mg/dL increase cardiovascular risk.',
    category: 'definition'
  },
  {
    id: 'ldl_high_causes',
    text: 'High LDL causes include: diet high in saturated and trans fats, lack of exercise, obesity, genetic factors (familial hypercholesterolemia), diabetes, hypothyroidism, kidney disease, and certain medications.',
    category: 'causes'
  },
  {
    id: 'glucose_definition',
    text: 'Glucose measures blood sugar at the time of test. Normal fasting glucose is 70-100 mg/dL. Values 100-125 mg/dL indicate prediabetes. Values above 126 mg/dL indicate diabetes. High glucose can cause immediate symptoms and long-term complications.',
    category: 'definition'
  },
  {
    id: 'glucose_high_causes',
    text: 'High glucose causes include: diabetes (type 1 or 2), stress, illness, medications (steroids, diuretics), pancreatic disorders, hormonal imbalances, excessive carbohydrate intake, and lack of physical activity.',
    category: 'causes'
  },
  {
    id: 'creatinine_definition',
    text: 'Creatinine measures kidney function. Normal ranges vary by age, gender, and muscle mass. Typical ranges: Men 0.7-1.3 mg/dL, Women 0.6-1.1 mg/dL. High creatinine indicates reduced kidney function or kidney disease.',
    category: 'definition'
  },
  {
    id: 'creatinine_high_causes',
    text: 'High creatinine causes include: kidney disease, dehydration, high protein diet, muscle breakdown, certain medications (NSAIDs, ACE inhibitors), urinary tract obstruction, and reduced blood flow to kidneys.',
    category: 'causes'
  },
  {
    id: 'triglycerides_definition',
    text: 'Triglycerides are a type of fat in blood. Normal levels are below 150 mg/dL. Values 150-199 mg/dL are borderline high. Values above 200 mg/dL are high and increase cardiovascular risk.',
    category: 'definition'
  },
  {
    id: 'triglycerides_high_causes',
    text: 'High triglycerides causes include: excessive calorie intake, high sugar and refined carbohydrate consumption, alcohol abuse, obesity, diabetes, hypothyroidism, kidney disease, and genetic factors.',
    category: 'causes'
  },
  {
    id: 'hemoglobin_definition',
    text: 'Hemoglobin carries oxygen in red blood cells. Normal ranges: Men 13.5-17.5 g/dL, Women 12.0-15.5 g/dL. Low hemoglobin indicates anemia. High hemoglobin can indicate dehydration or polycythemia.',
    category: 'definition'
  },
  {
    id: 'hemoglobin_low_causes',
    text: 'Low hemoglobin (anemia) causes include: iron deficiency, vitamin B12 or folate deficiency, chronic blood loss, chronic disease, bone marrow disorders, kidney disease, and genetic conditions like sickle cell anemia.',
    category: 'causes'
  },
  {
    id: 'vitamin_d_definition',
    text: 'Vitamin D is essential for bone health and immune function. Normal levels are 30-100 ng/mL. Levels below 20 ng/mL indicate deficiency. Vitamin D deficiency is common and linked to bone disorders and immune dysfunction.',
    category: 'definition'
  },
  {
    id: 'vitamin_d_low_causes',
    text: 'Low vitamin D causes include: limited sun exposure, dark skin, older age, obesity, malabsorption disorders, kidney or liver disease, certain medications, and inadequate dietary intake of vitamin D rich foods.',
    category: 'causes'
  }
];

/**
 * Nutrition and lifestyle guidelines data
 */
const nutritionData = [
  {
    id: 'hba1c_lower_diet',
    text: 'To lower HbA1c: Focus on low-glycemic foods like whole grains, vegetables, legumes, and lean proteins. Avoid refined sugars, white bread, and processed foods. Include fiber-rich foods, maintain regular meal timing, and control portion sizes. Regular exercise is essential.',
    category: 'diet'
  },
  {
    id: 'hdl_raise_diet',
    text: 'To raise HDL: Include healthy fats from olive oil, avocados, nuts, and fatty fish. Eat omega-3 rich foods like salmon and walnuts. Moderate alcohol consumption may help (if appropriate). Regular aerobic exercise significantly raises HDL levels.',
    category: 'diet'
  },
  {
    id: 'ldl_lower_diet',
    text: 'To lower LDL: Reduce saturated fats (red meat, full-fat dairy) and eliminate trans fats. Increase soluble fiber from oats, beans, apples, and barley. Include plant sterols, nuts, and fatty fish. Limit processed foods and maintain healthy weight.',
    category: 'diet'
  },
  {
    id: 'glucose_control_diet',
    text: 'To control glucose: Eat balanced meals with protein, healthy fats, and complex carbs. Avoid sugary drinks and refined carbohydrates. Include fiber, maintain regular meal timing, and practice portion control. Combine with regular physical activity.',
    category: 'diet'
  },
  {
    id: 'creatinine_kidney_diet',
    text: 'For high creatinine/kidney health: Stay well-hydrated with water. Reduce protein intake if advised by doctor. Limit sodium and processed foods. Avoid nephrotoxic substances. Include antioxidant-rich fruits and vegetables. Consult nephrologist for personalized plan.',
    category: 'diet'
  },
  {
    id: 'triglycerides_lower_diet',
    text: 'To lower triglycerides: Reduce sugar and refined carbohydrates. Limit alcohol consumption. Include omega-3 fatty acids from fish. Eat whole grains, vegetables, and lean proteins. Maintain healthy weight and exercise regularly.',
    category: 'diet'
  },
  {
    id: 'anemia_iron_diet',
    text: 'For low hemoglobin/iron deficiency: Include iron-rich foods like lean red meat, poultry, fish, beans, lentils, spinach, and fortified cereals. Pair with vitamin C sources to enhance absorption. Avoid tea/coffee with iron-rich meals. Consider iron supplements if advised.',
    category: 'diet'
  },
  {
    id: 'vitamin_d_increase',
    text: 'To increase vitamin D: Get moderate sun exposure (10-30 minutes daily). Include fatty fish (salmon, mackerel), egg yolks, fortified dairy products, and mushrooms. Consider vitamin D supplements, especially in winter months or if deficient.',
    category: 'diet'
  },
  {
    id: 'general_heart_health',
    text: 'Heart-healthy lifestyle: Follow Mediterranean or DASH diet. Exercise 150 minutes per week. Maintain healthy weight. Don\'t smoke. Manage stress. Get adequate sleep. Limit alcohol. Monitor blood pressure and cholesterol regularly.',
    category: 'lifestyle'
  },
  {
    id: 'diabetes_management',
    text: 'Diabetes management: Monitor blood sugar regularly. Follow carbohydrate counting or meal planning. Exercise regularly. Take medications as prescribed. Regular check-ups with healthcare team. Foot care and eye exams. Stress management and adequate sleep.',
    category: 'lifestyle'
  }
];

/**
 * Main ingestion function
 */
async function ingestData() {
  console.log('🚀 Starting Pinecone data ingestion...\n');
  
  // Initialize OpenAI if available
  await initializeOpenAI();
  console.log('');
  
  try {
    // Verify index exists
    console.log(`📋 Checking index: ${indexName}`);
    const stats = await index.describeIndexStats();
    console.log(`✅ Index found. Current vector count: ${stats.totalRecordCount || 0}\n`);
    
    // Process biomarkers namespace
    console.log('📊 Processing biomarkers namespace...');
    const biomarkerVectors = [];
    
    for (const item of biomarkerData) {
      console.log(`  Generating embedding for: ${item.id}`);
      const embedding = await generateEmbedding(item.text);
      
      if (embedding.length !== EMBEDDING_DIMENSION) {
        console.error(`  ❌ Invalid embedding dimension for ${item.id}: ${embedding.length}`);
        continue;
      }
      
      biomarkerVectors.push({
        id: item.id,
        values: embedding,
        metadata: {
          text: item.text,
          category: item.category,
          type: 'biomarker'
        }
      });
    }
    
    console.log(`  ✅ Generated ${biomarkerVectors.length} biomarker embeddings\n`);
    
    // Upsert biomarkers
    if (biomarkerVectors.length > 0) {
      console.log('  📤 Upserting biomarkers to Pinecone...');
      await index.namespace('biomarkers').upsert(biomarkerVectors);
      console.log(`  ✅ Successfully upserted ${biomarkerVectors.length} vectors to 'biomarkers' namespace\n`);
    }
    
    // Process nutrition namespace
    console.log('🥗 Processing nutrition_guidelines namespace...');
    const nutritionVectors = [];
    
    for (const item of nutritionData) {
      console.log(`  Generating embedding for: ${item.id}`);
      const embedding = await generateEmbedding(item.text);
      
      if (embedding.length !== EMBEDDING_DIMENSION) {
        console.error(`  ❌ Invalid embedding dimension for ${item.id}: ${embedding.length}`);
        continue;
      }
      
      nutritionVectors.push({
        id: item.id,
        values: embedding,
        metadata: {
          text: item.text,
          category: item.category,
          type: 'nutrition'
        }
      });
    }
    
    console.log(`  ✅ Generated ${nutritionVectors.length} nutrition embeddings\n`);
    
    // Upsert nutrition guidelines
    if (nutritionVectors.length > 0) {
      console.log('  📤 Upserting nutrition guidelines to Pinecone...');
      await index.namespace('nutrition_guidelines').upsert(nutritionVectors);
      console.log(`  ✅ Successfully upserted ${nutritionVectors.length} vectors to 'nutrition_guidelines' namespace\n`);
    }
    
    // Verify final count
    const finalStats = await index.describeIndexStats();
    console.log('📊 Final Index Statistics:');
    console.log(`   Total vectors: ${finalStats.totalRecordCount || 0}`);
    if (finalStats.namespaces) {
      Object.entries(finalStats.namespaces).forEach(([ns, count]) => {
        console.log(`   ${ns}: ${count.recordCount || 0} vectors`);
      });
    }
    
    console.log('\n✅ Ingestion completed successfully!');
    console.log(`\n📈 Summary:`);
    console.log(`   Biomarkers: ${biomarkerVectors.length} vectors`);
    console.log(`   Nutrition: ${nutritionVectors.length} vectors`);
    console.log(`   Total: ${biomarkerVectors.length + nutritionVectors.length} vectors`);
    
  } catch (error) {
    console.error('\n❌ Ingestion failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run ingestion
ingestData();


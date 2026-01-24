import OpenAI from 'openai';
import Report from '../models/Report.model.js';
import { generateDoctorSummary } from './gemini.service.js';
import { getReportRetestRecommendation } from '../utils/retest.util.js';

// OpenAI client for report-scoped chatbot and TTS
const openaiApiKey = process.env.OPENAI_CHAT_API_KEY;

let openaiClient = null;
if (openaiApiKey) {
  openaiClient = new OpenAI({ apiKey: openaiApiKey });
} else {
  console.warn('⚠️ OPENAI_CHAT_API_KEY is not set. Chatbot will be disabled.');
}

// Compute a simple wellness score (same idea as dashboard)
const computeHealthScore = (report) => {
  if (!report || !Array.isArray(report.biomarkers) || report.biomarkers.length === 0) {
    return { score: 0, normal: 0, total: 0 };
  }
  const total = report.biomarkers.length;
  const normal = report.biomarkers.filter((b) => b.status === 'NORMAL').length;
  const score = total > 0 ? Math.round((normal / total) * 100) : 0;
  return { score, normal, total };
};

// Build textual context for OpenAI based on user's reports
export const buildReportChatContext = async (userId, reportId) => {
  // Latest report for this chat
  const currentReport = await Report.findOne({ _id: reportId, userId }).lean();
  if (!currentReport) {
    throw new Error('Report not found');
  }

  // Last 3 reports for trend-style context
  const recentReports = await Report.find({ userId })
    .sort({ reportDate: -1 })
    .limit(3)
    .lean();

  const healthScore = computeHealthScore(currentReport);

  // Collect abnormal biomarkers in current report
  const abnormal = (currentReport.biomarkers || []).filter(
    (b) => b.status && b.status !== 'NORMAL'
  );

  // Very lightweight trend description across recent reports
  const trends = {};
  recentReports.forEach((r) => {
    (r.biomarkers || []).forEach((b) => {
      if (!trends[b.testName]) {
        trends[b.testName] = [];
      }
      trends[b.testName].push({
        date: r.reportDate,
        value: b.value,
        status: b.status,
      });
    });
  });

  const trendSummaries = Object.entries(trends).map(([name, points]) => {
    if (points.length < 2) {
      return `${name}: only one data point so far.`;
    }
    const sorted = points.sort((a, b) => new Date(a.date) - new Date(b.date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first.value || !last.value) {
      return `${name}: insufficient numeric data.`;
    }
    const change = last.value - first.value;
    const changePct = first.value ? ((change / first.value) * 100).toFixed(1) : '0';
    let direction = 'stable';
    if (Math.abs(change) < 5) direction = 'stable';
    else if (change > 0) direction = 'increasing';
    else direction = 'decreasing';
    return `${name}: ${direction} from ${first.value} to ${last.value} (${changePct}% change).`;
  });

  // Doctor-ready style summary using existing Gemini helper
  let doctorSummary = [];
  try {
    const abnormalBiomarkers = [];
    recentReports.forEach((r) => {
      (r.biomarkers || []).forEach((b) => {
        if (b.status && b.status !== 'NORMAL') {
          abnormalBiomarkers.push({
            testName: b.testName,
            value: b.value,
            unit: b.unit,
            status: b.status,
            reportDate: r.reportDate,
          });
        }
      });
    });
    doctorSummary = await generateDoctorSummary(recentReports, abnormalBiomarkers);
  } catch (err) {
    console.warn('Doctor summary for chatbot failed, continuing with local context only.', err.message);
  }

  const retestRecommendation =
    currentReport.retestRecommendation ||
    getReportRetestRecommendation(currentReport.biomarkers || []);

  return {
    currentReport,
    recentReports,
    healthScore,
    abnormal,
    trendSummaries,
    doctorSummary,
    retestRecommendation,
  };
};

// Basic guard to reject out-of-scope questions before calling OpenAI
export const isOutOfScopeQuestion = (message) => {
  if (!message) return true;
  const text = message.toLowerCase();

  const inScopeKeywords = [
    'report',
    'result',
    'value',
    'test',
    'biomarker',
    'trend',
    'hba1c',
    'cholesterol',
    'vitamin',
    'creatinine',
    'urea',
    'glucose',
  ];

  const hasInScopeKeyword = inScopeKeywords.some((kw) => text.includes(kw));

  // If user explicitly asks for diagnosis / treatment, treat as out of scope
  const forbiddenKeywords = ['diagnosis', 'diagnose', 'treat', 'cure', 'medication', 'drug'];
  const hasForbidden = forbiddenKeywords.some((kw) => text.includes(kw));

  return !hasInScopeKeyword || hasForbidden;
};

export const getChatbotReply = async (userId, reportId, message) => {
  if (!openaiClient) {
    return {
      text: 'Chatbot is not currently configured. Please try again later.',
    };
  }

  const context = await buildReportChatContext(userId, reportId);

  const systemPrompt = `
You are a calm, friendly wellness assistant for a lab report app.
You MUST base every answer only on the provided report context.
You are NOT a doctor and must NOT provide diagnosis, prescriptions, or treatment plans.
You ONLY:
- explain biomarker values and whether they are high, low, or normal
- explain simple trends (improving / worsening / stable)
- explain the overall health score
- suggest when the user might consider repeating the test, in months or days (use the retestRecommendation from context when available)

IMPORTANT: When discussing biomarkers or retest timing:
- If retestRecommendation is available in the context, mention it: "Based on general wellness guidelines, you might consider retesting after [interval]."
- If retestRecommendation is not available or unclear, use this exact message: "Based on general wellness guidelines, please consult your healthcare provider for the recommended retest interval."

If the user asks anything outside the report (e.g. generic medical questions, diagnosis, medication advice), reply EXACTLY with:
"I can explain your report. For general health information, please switch to General Info mode."

Keep answers short (3–6 sentences), simple, and wellness-focused.
Use reassuring, non-alarming language.
`;

  const userContext = {
    healthScore: context.healthScore,
    abnormalBiomarkers: context.abnormal,
    trendSummaries: context.trendSummaries,
    doctorSummary: context.doctorSummary,
    retestRecommendation: context.retestRecommendation,
  };

  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `
Here is the context for the current user and report (JSON):
${JSON.stringify(userContext, null, 2)}

User question:
${message}
`,
      },
    ],
    temperature: 0.5,
    max_tokens: 400,
  });

  const text = completion.choices[0]?.message?.content?.trim() || '';
  return { text };
};

// Text-to-speech using OpenAI (kept for backward compatibility, but frontend uses browser TTS)
export const synthesizeSpeech = async (text) => {
  if (!openaiClient) {
    throw new Error('Chatbot OpenAI client not configured');
  }
  if (!text || typeof text !== 'string') {
    throw new Error('Text is required for TTS');
  }

  const response = await openaiClient.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: text,
  });

  // Return base64 so the frontend can construct an audio blob
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString('base64');
};

// General Health Info Mode - Only from verified official sources
export const getGeneralHealthInfo = async (message) => {
  if (!openaiClient) {
    return {
      text: 'General health information mode is not currently available.',
    };
  }

  // Strict system prompt to only use verified sources
  const systemPrompt = `
You are a health information assistant that ONLY provides information from verified official medical sources.

CRITICAL RULES:
1. You MUST only answer if you can reference information from official sources like:
   - World Health Organization (WHO)
   - National Institutes of Health (NIH)
   - Centers for Disease Control and Prevention (CDC)
   - Indian Ministry of Health and Family Welfare
   - Other government health agencies

2. You MUST NOT:
   - Provide diagnosis or personalized medical advice
   - Prescribe treatments or medications
   - Generate information from your own knowledge without source verification
   - Answer questions about specific medical conditions requiring diagnosis

3. If you cannot find verified information from official sources, respond EXACTLY with:
   "I could not find verified information from official medical sources. Please consult a healthcare provider or visit official health websites like WHO, NIH, or CDC."

4. Keep answers brief (2-4 sentences), educational, and always mention it's general information only.

5. Always end with: "This is general information only. Consult a healthcare provider for personalized advice."
`;

  try {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `User question: ${message}\n\nIMPORTANT: Only answer if you can reference verified official medical sources. Otherwise, say you could not find verified information.`,
        },
      ],
      temperature: 0.3, // Lower temperature for more factual responses
      max_tokens: 300,
    });

    const text = completion.choices[0]?.message?.content?.trim() || '';
    
    // Additional safety check - if response seems too generic or doesn't mention sources, be cautious
    if (text && !text.toLowerCase().includes('could not find')) {
      // Ensure disclaimer is present
      if (!text.toLowerCase().includes('consult a healthcare provider')) {
        return { text: text + ' This is general information only. Consult a healthcare provider for personalized advice.' };
      }
    }
    
    return { text };
  } catch (error) {
    console.error('General health info error:', error);
    return {
      text: 'I could not find verified information from official medical sources. Please consult a healthcare provider or visit official health websites.',
    };
  }
};


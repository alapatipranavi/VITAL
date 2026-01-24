// Simple rule-based retest recommendation logic.
// Focused on wellness intervals only – NOT medical advice.

const RETEST_RULES = [
  { match: /hba1c/i, interval: '3 months' },
  { match: /(total cholesterol|ldl|hdl|triglycerides|lipid profile)/i, interval: '6 months' },
  { match: /vitamin d/i, interval: '2–3 months' },
  { match: /creatinine/i, interval: '3 months', abnormalOnly: true },
];

export const getBiomarkerRetestInterval = (testName, status) => {
  if (!testName) return null;
  const name = String(testName);

  // Only suggest shorter intervals for abnormal values.
  const isAbnormal = status && status !== 'NORMAL';

  for (const rule of RETEST_RULES) {
    if (rule.match.test(name)) {
      // For rules that only apply to abnormal values (e.g., Creatinine)
      if (rule.abnormalOnly && !isAbnormal) {
        return null; // Don't suggest retest for normal values
      }
      return rule.interval;
    }
  }

  // If test is not listed or interval is unclear, return null
  // The chatbot will use the fallback message
  return null;
};

// Derive a single, human-friendly recommendation for an entire report.
export const getReportRetestRecommendation = (biomarkers = []) => {
  if (!Array.isArray(biomarkers) || biomarkers.length === 0) {
    return null;
  }

  const intervals = new Set();

  biomarkers.forEach((b) => {
    if (!b?.testName) return;
    const interval = getBiomarkerRetestInterval(b.testName, b.status);
    if (interval) intervals.add(interval);
  });

  if (intervals.size === 0) return null;

  // Simple heuristic: pick the shortest interval (most frequent retest needed)
  // Convert to numeric months for comparison
  const intervalToMonths = (interval) => {
    if (interval.includes('2–3')) return 2.5;
    if (interval.includes('3')) return 3;
    if (interval.includes('6')) return 6;
    return 12; // default
  };

  const ranked = Array.from(intervals).sort((a, b) => intervalToMonths(a) - intervalToMonths(b));
  return ranked[0];
};


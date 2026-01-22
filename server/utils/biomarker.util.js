/**
 * Parse reference range string and extract min/max values
 * Handles formats like "4.0 - 5.6", "< 5.6", "> 4.0", etc.
 */
export const parseReferenceRange = (rangeStr) => {
  if (!rangeStr) return null;

  const cleaned = rangeStr.trim();
  
  // Handle range format: "4.0 - 5.6"
  const rangeMatch = cleaned.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
  if (rangeMatch) {
    return {
      min: parseFloat(rangeMatch[1]),
      max: parseFloat(rangeMatch[2])
    };
  }

  // Handle less than: "< 5.6"
  const lessThanMatch = cleaned.match(/<\s*(\d+\.?\d*)/);
  if (lessThanMatch) {
    return {
      min: null,
      max: parseFloat(lessThanMatch[1])
    };
  }

  // Handle greater than: "> 4.0"
  const greaterThanMatch = cleaned.match(/>\s*(\d+\.?\d*)/);
  if (greaterThanMatch) {
    return {
      min: parseFloat(greaterThanMatch[1]),
      max: null
    };
  }

  return null;
};

/**
 * Determine biomarker status (NORMAL, HIGH, LOW)
 */
export const determineStatus = (value, referenceRange) => {
  const range = parseReferenceRange(referenceRange);
  if (!range) return 'NORMAL';

  if (range.min !== null && range.max !== null) {
    // Standard range
    if (value < range.min) return 'LOW';
    if (value > range.max) return 'HIGH';
    return 'NORMAL';
  } else if (range.max !== null) {
    // Less than format
    return value > range.max ? 'HIGH' : 'NORMAL';
  } else if (range.min !== null) {
    // Greater than format
    return value < range.min ? 'LOW' : 'NORMAL';
  }

  return 'NORMAL';
};

/**
 * Normalize units (basic normalization for common units)
 */
export const normalizeUnit = (unit) => {
  const normalized = unit.trim().toLowerCase();
  
  // Common unit mappings
  const mappings = {
    'mg/dl': 'mg/dL',
    'mg/dl': 'mg/dL',
    'g/dl': 'g/dL',
    'g/dl': 'g/dL',
    '%': '%',
    'mmol/l': 'mmol/L',
    'iu/l': 'IU/L',
    'u/l': 'U/L'
  };

  return mappings[normalized] || unit;
};


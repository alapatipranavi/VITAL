/**
 * Centralized error handling utilities
 */

export const handleGeminiError = (error) => {
  if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
    return {
      message: 'Invalid Gemini API key',
      userMessage: 'The API key for Gemini is invalid. Please check your GEMINI_API_KEY in the .env file.',
      statusCode: 500
    };
  }
  
  if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
    return {
      message: 'API quota exceeded',
      userMessage: 'Gemini API quota exceeded. Please check your API usage limits.',
      statusCode: 429
    };
  }
  
  if (error.message?.includes('safety')) {
    return {
      message: 'Content blocked by safety filters',
      userMessage: 'Content was blocked by safety filters. Please try a different image.',
      statusCode: 400
    };
  }
  
  return {
    message: error.message || 'Unknown error',
    userMessage: 'An error occurred while processing your request.',
    statusCode: 500
  };
};

export const handleFileError = (error) => {
  if (error.code === 'ENOENT') {
    return {
      message: 'File not found',
      userMessage: 'The uploaded file could not be found.',
      statusCode: 400
    };
  }
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return {
      message: 'File too large',
      userMessage: 'File size exceeds the maximum limit of 10MB.',
      statusCode: 400
    };
  }
  
  return {
    message: error.message || 'File processing error',
    userMessage: 'An error occurred while processing the file.',
    statusCode: 500
  };
};


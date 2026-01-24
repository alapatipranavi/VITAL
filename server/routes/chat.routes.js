import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getChatbotReply, isOutOfScopeQuestion, synthesizeSpeech, getGeneralHealthInfo } from '../services/chatbot.service.js';

const router = express.Router();

// POST /api/chat/report
router.post('/report', authenticate, async (req, res) => {
  try {
    const { reportId, message } = req.body || {};
    if (!reportId || !message) {
      return res.status(400).json({ message: 'reportId and message are required' });
    }

    // Hard guard for out-of-scope questions
    if (isOutOfScopeQuestion(message)) {
      return res.json({
        reply: 'I can explain your report. For general health information, please switch to General Info mode.',
      });
    }

    const result = await getChatbotReply(req.user._id, reportId, message);
    return res.json({ reply: result.text });
  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(500).json({
      message: 'Unable to generate chatbot reply at this time.',
    });
  }
});

// POST /api/chat/general - General health info mode (verified sources only)
router.post('/general', authenticate, async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ message: 'message is required' });
    }

    const result = await getGeneralHealthInfo(message);
    return res.json({ reply: result.text });
  } catch (error) {
    console.error('General health info error:', error);
    return res.status(500).json({
      message: 'Unable to retrieve health information at this time.',
    });
  }
});

// POST /api/chat/tts (kept for backward compatibility, but frontend uses browser TTS)
router.post('/tts', authenticate, async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) {
      return res.status(400).json({ message: 'text is required' });
    }
    const audioBase64 = await synthesizeSpeech(text);
    return res.json({ audio: audioBase64 });
  } catch (error) {
    console.error('TTS error:', error);
    return res.status(500).json({
      message: 'Unable to generate audio at this time.',
    });
  }
});

export default router;


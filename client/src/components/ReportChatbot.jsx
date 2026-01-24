import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api.service';
import './ReportChatbot.css';

const ReportChatbot = ({ reportId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMode, setChatMode] = useState('report'); // 'report' or 'general'
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize browser Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // In general mode, reportId is optional
    if (chatMode === 'report' && !reportId) return;

    const newUserMsg = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput('');
    setLoading(true);

    try {
      let botText;
      if (chatMode === 'report') {
        const res = await apiService.chatWithReport(reportId, trimmed);
        botText = res.reply || 'I can only help explain your uploaded health report.';
      } else {
        const res = await apiService.chatGeneralHealth(trimmed);
        botText = res.reply || 'I could not find verified information from official medical sources.';
      }
      setMessages((prev) => [...prev, { role: 'assistant', text: botText }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I was unable to answer that. Please try again in a moment.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text) => {
    // Use browser-native Text-to-Speech (no API key needed)
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser.');
    }
  };

  return (
    <div className="chatbot-card">
      <div className="chatbot-header">
        <div>
          <h3>Health Assistant</h3>
          <p className="chatbot-subtitle">
            {chatMode === 'report' 
              ? 'Ask about this report, trends, and retest timing.'
              : 'Ask general health information questions (from verified sources only).'}
          </p>
        </div>
        <div className="chatbot-mode-toggle">
          <button
            type="button"
            className={`mode-btn ${chatMode === 'report' ? 'active' : ''}`}
            onClick={() => setChatMode('report')}
            disabled={!reportId}
          >
            Report Mode
          </button>
          <button
            type="button"
            className={`mode-btn ${chatMode === 'general' ? 'active' : ''}`}
            onClick={() => setChatMode('general')}
          >
            General Info
          </button>
        </div>
      </div>
      <div className="chatbot-disclaimer">
        This chatbot provides informational wellness insights and is not a substitute for professional medical advice.
      </div>
      <div className="chatbot-messages">
        {messages.length === 0 && (
          <div className="chatbot-empty">
            <p>Example questions:</p>
            <ul>
              {chatMode === 'report' ? (
                <>
                  <li>Why is this value high or low?</li>
                  <li>Is my health improving?</li>
                  <li>When should I test again?</li>
                </>
              ) : (
                <>
                  <li>What is HbA1c?</li>
                  <li>What are normal cholesterol levels?</li>
                  <li>How often should I get a health checkup?</li>
                </>
              )}
            </ul>
          </div>
        )}
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`chatbot-message ${m.role === 'user' ? 'user' : 'assistant'}`}
          >
            <div className="message-text">{m.text}</div>
            {m.role === 'assistant' && (
              <button
                type="button"
                className="speak-button"
                onClick={() => handleSpeak(m.text)}
                aria-label="Play voice explanation"
              >
                🔊
              </button>
            )}
          </div>
        ))}
        {loading && <div className="chatbot-typing">Thinking…</div>}
      </div>
      <form className="chatbot-input-row" onSubmit={handleSend}>
        <button
          type="button"
          className={`voice-input-btn ${isListening ? 'listening' : ''}`}
          onClick={handleVoiceInput}
          aria-label="Voice input"
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          🎤
        </button>
        <input
          type="text"
          className="chatbot-input"
          placeholder={chatMode === 'report' 
            ? 'Ask about this report, trends, or when to retest…'
            : 'Ask general health information questions…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ReportChatbot;


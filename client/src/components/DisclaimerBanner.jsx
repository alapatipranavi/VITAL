import { useState } from 'react';
import './DisclaimerBanner.css';

const DisclaimerBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="disclaimer-banner">
      <div className="disclaimer-content">
        <span className="disclaimer-icon">ℹ️</span>
        <span className="disclaimer-text">
          Medical Disclaimer: This application provides wellness insights only and does not replace professional medical advice, diagnosis, or treatment.
        </span>
        <button 
          className="disclaimer-close"
          onClick={() => setIsVisible(false)}
          aria-label="Close disclaimer"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default DisclaimerBanner;

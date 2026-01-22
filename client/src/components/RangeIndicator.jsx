import './RangeIndicator.css';

const RangeIndicator = ({ value, referenceRange, unit, status }) => {
  // Parse reference range
  const parseRange = (rangeStr) => {
    if (!rangeStr) return { min: 0, max: 100 };
    
    const cleaned = rangeStr.trim();
    const rangeMatch = cleaned.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    if (rangeMatch) {
      return {
        min: parseFloat(rangeMatch[1]),
        max: parseFloat(rangeMatch[2])
      };
    }
    
    const lessThanMatch = cleaned.match(/<\s*(\d+\.?\d*)/);
    if (lessThanMatch) {
      return { min: 0, max: parseFloat(lessThanMatch[1]) };
    }
    
    const greaterThanMatch = cleaned.match(/>\s*(\d+\.?\d*)/);
    if (greaterThanMatch) {
      return { min: parseFloat(greaterThanMatch[1]), max: parseFloat(greaterThanMatch[1]) * 2 };
    }
    
    return { min: 0, max: 100 };
  };

  const range = parseRange(referenceRange);
  const numValue = parseFloat(value);
  
  // Calculate position percentage
  const rangeSpan = range.max - range.min;
  const valuePosition = rangeSpan > 0 
    ? ((numValue - range.min) / rangeSpan) * 100 
    : 50;
  
  // Clamp between 0 and 100
  const clampedPosition = Math.max(0, Math.min(100, valuePosition));
  
  // Determine colors based on status
  const getStatusColor = () => {
    if (status === 'HIGH') return '#ef4444';
    if (status === 'LOW') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="range-indicator">
      <div className="range-label">
        <span>Ref: {referenceRange}</span>
      </div>
      <div className="range-slider">
        <div className="range-track">
          <div 
            className="range-normal" 
            style={{
              left: '0%',
              width: '100%'
            }}
          ></div>
        </div>
        <div 
          className="range-marker"
          style={{
            left: `${clampedPosition}%`,
            backgroundColor: getStatusColor()
          }}
        >
          <div className="marker-value">{value}</div>
          <div className="marker-dot"></div>
        </div>
      </div>
      <div className="range-zones">
        <span className="zone-label low-zone">Low</span>
        <span className="zone-label normal-zone">Normal</span>
        <span className="zone-label high-zone">High</span>
      </div>
    </div>
  );
};

export default RangeIndicator;

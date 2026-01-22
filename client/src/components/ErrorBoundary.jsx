import React from 'react';

/**
 * Prevents "white screen" by catching unexpected render/runtime errors.
 * No new libraries, pure React.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console for debugging (as requested)
    // eslint-disable-next-line no-console
    console.error('UI crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container">
          <div className="card">
            <h2>Something went wrong</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              The page hit an unexpected error. Please refresh and try again.
            </p>
            <div className="disclaimer-box" style={{ marginTop: '1rem' }}>
              <strong>⚠️ Disclaimer:</strong> This is not a medical prescription. Consult a doctor.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



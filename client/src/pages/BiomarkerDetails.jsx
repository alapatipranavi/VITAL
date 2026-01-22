import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import Navbar from '../components/Navbar';
import './BiomarkerDetails.css';

const BiomarkerDetails = () => {
  const { reportId } = useParams();
  const { user, logout } = useAuth();
  const [report, setReport] = useState(null);
  const [selectedBiomarker, setSelectedBiomarker] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const reportData = await apiService.getReportById(reportId);
      setReport(reportData);
      if (reportData.biomarkers.length > 0) {
        setSelectedBiomarker(reportData.biomarkers[0]);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBiomarkerClick = async (biomarker) => {
    setSelectedBiomarker(biomarker);
    setDetails(null); // Reset details when switching biomarkers
    setLoadingDetails(true);
    try {
      const detailsData = await apiService.getBiomarkerDetails(
        biomarker.testName,
        reportId
      );
      // Safely set details even if explanation is missing
      setDetails(detailsData || {});
    } catch (error) {
      console.error('Failed to fetch biomarker details:', error);
      // Set empty details object on error to prevent white screen
      setDetails({});
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar user={user} logout={logout} />
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div>
        <Navbar user={user} logout={logout} />
        <div className="container">
          <div className="error-message">Report not found</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar user={user} logout={logout} />
      <div className="container">
        <div className="page-header">
          <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
          <h1>Report Details</h1>
          <p className="report-date">
            {new Date(report.reportDate).toLocaleDateString()}
          </p>
        </div>

        <div className="biomarker-layout">
          <div className="biomarker-list">
            <h2>Biomarkers ({report.biomarkers.length})</h2>
            <div className="biomarkers-grid">
              {report.biomarkers.map((biomarker, index) => (
                <div
                  key={index}
                  className={`biomarker-card ${
                    selectedBiomarker?.testName === biomarker.testName
                      ? 'selected'
                      : ''
                  } ${biomarker.status.toLowerCase()}`}
                  onClick={() => handleBiomarkerClick(biomarker)}
                >
                  <h3>{biomarker.testName}</h3>
                  <div className="biomarker-value">
                    {biomarker.value} {biomarker.unit}
                  </div>
                  <div className={`status-badge status-${biomarker.status.toLowerCase()}`}>
                    {biomarker.status}
                  </div>
                  <div className="reference-range">
                    Range: {biomarker.referenceRange}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="biomarker-details">
            {selectedBiomarker && (
              <>
                <h2>{selectedBiomarker.testName} Details</h2>
                <div className="card">
                  <div className="detail-section">
                    <h3>Test Result</h3>
                    <div className="detail-row">
                      <span>Value:</span>
                      <strong>
                        {selectedBiomarker.value} {selectedBiomarker.unit}
                      </strong>
                    </div>
                    <div className="detail-row">
                      <span>Status:</span>
                      <span
                        className={`status-badge status-${selectedBiomarker.status.toLowerCase()}`}
                      >
                        {selectedBiomarker.status}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>Reference Range:</span>
                      <span>{selectedBiomarker.referenceRange}</span>
                    </div>
                  </div>

                  {loadingDetails ? (
                    <div className="loading">Loading insights...</div>
                  ) : selectedBiomarker.status === 'NORMAL' ? (
                    <div className="detail-section">
                      <p className="normal-message">
                        ✅ This biomarker is within normal range. No specific
                        recommendations needed.
                      </p>
                    </div>
                  ) : details && details.explanation && typeof details.explanation === 'object' ? (
                    <>
                      <div className="detail-section">
                        <h3>Explanation</h3>
                        <p>{details.explanation.explanation || 'No AI insights available for this biomarker yet.'}</p>
                      </div>

                      {Array.isArray(details.explanation.dietarySuggestions) &&
                        details.explanation.dietarySuggestions.length > 0 && (
                        <div className="detail-section">
                          <h3>Dietary Suggestions</h3>
                          <ul>
                            {details.explanation.dietarySuggestions.map((suggestion, idx) => (
                              <li key={idx}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {Array.isArray(details.explanation.lifestyleRecommendations) &&
                        details.explanation.lifestyleRecommendations.length > 0 && (
                        <div className="detail-section">
                          <h3>Lifestyle Recommendations</h3>
                          <ul>
                            {details.explanation.lifestyleRecommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="disclaimer-box">
                        <strong>⚠️ Disclaimer:</strong> This is not a medical
                        prescription. Consult a doctor.
                      </div>
                    </>
                  ) : details && typeof details.explanation === 'string' && details.explanation.trim() ? (
                    // Backward compatibility in case backend returns explanation as string
                    <>
                      <div className="detail-section">
                        <h3>Explanation</h3>
                        <p>{details.explanation}</p>
                      </div>
                      <div className="disclaimer-box">
                        <strong>⚠️ Disclaimer:</strong> This is not a medical
                        prescription. Consult a doctor.
                      </div>
                    </>
                  ) : (
                    <div className="detail-section">
                      <div className="insight-fallback">
                        <p>
                          <strong>No AI insights available</strong>
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                          AI insights are temporarily unavailable for this biomarker. 
                          Please consult with a healthcare provider for detailed interpretation.
                        </p>
                        <div className="disclaimer-box" style={{ marginTop: '1rem' }}>
                          <strong>⚠️ Disclaimer:</strong> This is not a medical prescription. Consult a doctor.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiomarkerDetails;


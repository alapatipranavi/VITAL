import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import Navbar from '../components/Navbar';
import RangeIndicator from '../components/RangeIndicator';
import ReportChatbot from '../components/ReportChatbot';
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
        // Auto-fetch details for first biomarker
        handleBiomarkerClick(reportData.biomarkers[0]);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBiomarkerClick = async (biomarker) => {
    setSelectedBiomarker(biomarker);
    setDetails(null);
    setLoadingDetails(true);
    try {
      const detailsData = await apiService.getBiomarkerDetails(
        biomarker.testName,
        reportId
      );
      setDetails(detailsData || {});
    } catch (error) {
      console.error('Failed to fetch biomarker details:', error);
      setDetails({});
    } finally {
      setLoadingDetails(false);
    }
  };

  // Group biomarkers by status
  const normalBiomarkers = report?.biomarkers.filter(b => b.status === 'NORMAL') || [];
  const abnormalBiomarkers = report?.biomarkers.filter(b => b.status !== 'NORMAL') || [];

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
    <div className="biomarker-page">
      <Navbar user={user} logout={logout} />
      <div className="container">
        {/* Alerts Section */}
        {abnormalBiomarkers.length > 0 && (
          <div className="alerts-section">
            {abnormalBiomarkers.slice(0, 2).map((biomarker, idx) => (
              <div key={idx} className="alert-box">
                <span className="alert-icon">⚠️</span>
                <div>
                  <strong>{biomarker.testName}:</strong> This value is{' '}
                  {biomarker.status === 'HIGH' ? 'significantly above' : 'significantly below'} the normal range.
                  Please consult your healthcare provider.
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Extracted Biomarkers Header */}
        <div className="section-header-large">
          <h1 className="page-title">
            <span className="title-icon">📊</span>
            Extracted Biomarkers
          </h1>
        </div>

        {/* Biomarker Cards Grid */}
        <div className="biomarkers-container">
          {abnormalBiomarkers.length > 0 && (
            <div className="biomarker-group">
              <h2 className="group-title">Needs Attention</h2>
              <div className="biomarkers-grid">
                {abnormalBiomarkers.map((biomarker, index) => (
                  <div
                    key={`abnormal-${index}`}
                    className={`biomarker-card-modern ${
                      selectedBiomarker?.testName === biomarker.testName ? 'selected' : ''
                    } ${biomarker.status.toLowerCase()}`}
                    onClick={() => handleBiomarkerClick(biomarker)}
                  >
                    <div className="biomarker-card-header-modern">
                      <div className="status-icon-modern">
                        {biomarker.status === 'HIGH' ? '📈' : '📉'}
                      </div>
                      <div className={`status-badge-modern status-${biomarker.status.toLowerCase()}`}>
                        {biomarker.status}
                      </div>
                    </div>
                    <div className="biomarker-name-modern">{biomarker.testName}</div>
                    <div className="biomarker-ref-modern">Ref: {biomarker.referenceRange}</div>
                    <div className={`biomarker-value-modern value-${biomarker.status.toLowerCase()}`}>
                      {biomarker.value} {biomarker.unit}
                    </div>
                    <div className="biomarker-percentage">95%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {normalBiomarkers.length > 0 && (
            <div className="biomarker-group">
              <h2 className="group-title">
                <span className="group-icon">✅</span>
                Normal Results ({normalBiomarkers.length})
              </h2>
              <div className="biomarkers-grid">
                {normalBiomarkers.map((biomarker, index) => (
                  <div
                    key={`normal-${index}`}
                    className={`biomarker-card-modern ${
                      selectedBiomarker?.testName === biomarker.testName ? 'selected' : ''
                    } normal`}
                    onClick={() => handleBiomarkerClick(biomarker)}
                  >
                    <div className="biomarker-card-header-modern">
                      <div className="status-icon-modern">✅</div>
                      <div className="status-badge-modern status-normal">Normal</div>
                    </div>
                    <div className="biomarker-name-modern">{biomarker.testName}</div>
                    <div className="biomarker-ref-modern">Ref: {biomarker.referenceRange}</div>
                    <div className="biomarker-value-modern value-normal">
                      {biomarker.value} {biomarker.unit}
                    </div>
                    <div className="biomarker-percentage">95%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Biomarker Details */}
        {selectedBiomarker && (
          <div className="biomarker-details-modern">
            <div className="detail-card">
              <div className="detail-header">
                <h2 className="detail-title">
                  {selectedBiomarker.testName}
                  <span className={`detail-status-badge status-${selectedBiomarker.status.toLowerCase()}`}>
                    {selectedBiomarker.status}
                  </span>
                </h2>
              </div>

              {/* Range Indicator */}
              <RangeIndicator
                value={selectedBiomarker.value}
                referenceRange={selectedBiomarker.referenceRange}
                unit={selectedBiomarker.unit}
                status={selectedBiomarker.status}
              />

              {/* AI Insights */}
              {loadingDetails ? (
                <div className="loading-insights">
                  <div className="spinner"></div>
                  <p>Loading insights...</p>
                </div>
              ) : selectedBiomarker.status === 'NORMAL' ? (
                <div className="insight-section">
                  <p className="normal-insight">
                    ✅ Your {selectedBiomarker.testName} is within the healthy range.
                  </p>
                </div>
              ) : details && details.explanation && typeof details.explanation === 'object' ? (
                <div className="insight-section">
                  <div className="insight-explanation">
                    <h3>Explanation</h3>
                    <p>{details.explanation.explanation || 'No AI insights available for this biomarker yet.'}</p>
                  </div>

                  {Array.isArray(details.explanation.lifestyleRecommendations) &&
                    details.explanation.lifestyleRecommendations.length > 0 && (
                    <div className="insight-lifestyle">
                      <h3>Lifestyle Tips</h3>
                      <ul>
                        {details.explanation.lifestyleRecommendations.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(details.explanation.dietarySuggestions) &&
                    details.explanation.dietarySuggestions.length > 0 && (
                    <div className="insight-foods">
                      <h3>Foods to Include</h3>
                      <div className="food-tags">
                        {details.explanation.dietarySuggestions.slice(0, 4).map((food, idx) => (
                          <span key={idx} className="food-tag include">
                            {food.toLowerCase().includes('fruit') ? 'fruits' :
                             food.toLowerCase().includes('vegetable') ? 'vegetables' :
                             food.toLowerCase().includes('grain') ? 'whole grains' :
                             food.toLowerCase().includes('protein') ? 'lean proteins' : food}
                          </span>
                        ))}
                      </div>
                      <h3 style={{ marginTop: '1rem' }}>Foods to Limit</h3>
                      <div className="food-tags">
                        <span className="food-tag limit">processed foods</span>
                        <span className="food-tag limit">excessive sugar</span>
                        <span className="food-tag limit">excessive salt</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="insight-section">
                  <div className="insight-fallback">
                    <p><strong>No AI insights available</strong></p>
                    <p>AI insights are temporarily unavailable for this biomarker. Please consult with a healthcare provider for detailed interpretation.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Report-scoped chatbot */}
            <ReportChatbot reportId={reportId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BiomarkerDetails;

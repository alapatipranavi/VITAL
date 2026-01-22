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
    setLoadingDetails(true);
    try {
      const detailsData = await apiService.getBiomarkerDetails(
        biomarker.testName,
        reportId
      );
      setDetails(detailsData);
    } catch (error) {
      console.error('Failed to fetch biomarker details:', error);
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
                  ) : details?.explanation ? (
                    <>
                      <div className="detail-section">
                        <h3>Explanation</h3>
                        <p>{details.explanation}</p>
                      </div>

                      {details.dietarySuggestions?.length > 0 && (
                        <div className="detail-section">
                          <h3>Dietary Suggestions</h3>
                          <ul>
                            {details.dietarySuggestions.map((suggestion, idx) => (
                              <li key={idx}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {details.lifestyleRecommendations?.length > 0 && (
                        <div className="detail-section">
                          <h3>Lifestyle Recommendations</h3>
                          <ul>
                            {details.lifestyleRecommendations.map((rec, idx) => (
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
                  ) : selectedBiomarker.status === 'NORMAL' ? (
                    <div className="detail-section">
                      <p className="normal-message">
                        ✅ This biomarker is within normal range. No specific
                        recommendations needed.
                      </p>
                    </div>
                  ) : (
                    <div className="detail-section">
                      <p>Loading insights for this biomarker...</p>
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


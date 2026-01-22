import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import Navbar from '../components/Navbar';
import './DoctorSummary.css';

const DoctorSummary = () => {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const summaryData = await apiService.getDoctorSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar user={user} logout={logout} />
        <div className="container">
          <div className="loading">Generating summary...</div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div>
        <Navbar user={user} logout={logout} />
        <div className="container">
          <div className="error-message">Failed to generate summary</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar user={user} logout={logout} />
      <div className="container">
        <div className="page-header">
          <h1>Doctor-Ready Summary</h1>
          <p>Concise medical summary for healthcare consultations</p>
        </div>

        <div className="summary-stats">
          <div className="stat-box">
            <h3>Total Reports</h3>
            <p>{summary.reportCount}</p>
          </div>
          <div className="stat-box">
            <h3>Abnormal Biomarkers</h3>
            <p>{summary.abnormalCount}</p>
          </div>
        </div>

        <div className="card summary-card">
          <h2>Key Points for Doctor Consultation</h2>
          <ol className="summary-list">
            {summary.summary.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ol>
        </div>

        {summary.abnormalBiomarkers.length > 0 && (
          <div className="card">
            <h2>Abnormal Biomarkers Overview</h2>
            <div className="abnormal-list">
              {summary.abnormalBiomarkers.map((biomarker, index) => (
                <div key={index} className="abnormal-item">
                  <div className="abnormal-header">
                    <h3>{biomarker.testName}</h3>
                    <span
                      className={`status-badge status-${biomarker.status.toLowerCase()}`}
                    >
                      {biomarker.status}
                    </span>
                  </div>
                  <div className="abnormal-details">
                    <p>
                      <strong>Value:</strong> {biomarker.value} {biomarker.unit}
                    </p>
                    <p>
                      <strong>Reference Range:</strong> {biomarker.referenceRange}
                    </p>
                    <p>
                      <strong>Report Date:</strong>{' '}
                      {new Date(biomarker.reportDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="disclaimer-box-large">
          <h3>⚠️ Important Medical Disclaimer</h3>
          <p>
            This summary is generated for informational purposes only and is not
            a substitute for professional medical advice, diagnosis, or treatment.
            Always consult with a qualified healthcare provider for medical
            concerns, diagnosis, and treatment options.
          </p>
          <p>
            The information provided should be used as a reference during your
            consultation with your healthcare provider, not as a standalone
            diagnostic tool.
          </p>
        </div>

        <div className="action-buttons">
          <Link to="/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
          <Link to="/trends" className="btn btn-primary">
            View Trends
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorSummary;


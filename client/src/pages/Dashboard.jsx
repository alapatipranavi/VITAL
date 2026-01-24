import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState([]);
  const [abnormalBiomarkers, setAbnormalBiomarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsData, abnormalData] = await Promise.all([
        apiService.getReports(),
        apiService.getAbnormalBiomarkers()
      ]);
      setReports(reportsData);
      setAbnormalBiomarkers(abnormalData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id) => {
    try {
      await apiService.deleteReport(id);
      // Remove from local state immediately
      setReports(prev => prev.filter(r => r._id !== id));
      // Refresh abnormal biomarkers
      const abnormalData = await apiService.getAbnormalBiomarkers();
      setAbnormalBiomarkers(abnormalData);
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report. Please try again.');
    }
  };

  // Calculate health metrics
  const calculateHealthScore = () => {
    if (reports.length === 0) return { score: 0, normal: 0, total: 0 };
    
    const latestReport = reports[0];
    if (!latestReport || !latestReport.biomarkers) return { score: 0, normal: 0, total: 0 };
    
    const total = latestReport.biomarkers.length;
    const normal = latestReport.biomarkers.filter(b => b.status === 'NORMAL').length;
    const score = total > 0 ? Math.round((normal / total) * 100) : 0;
    
    return { score, normal, total };
  };

  const getStatusCounts = () => {
    if (reports.length === 0) return { normal: 0, high: 0, low: 0, total: 0 };
    
    const latestReport = reports[0];
    if (!latestReport || !latestReport.biomarkers) return { normal: 0, high: 0, low: 0, total: 0 };
    
    const biomarkers = latestReport.biomarkers;
    return {
      total: biomarkers.length,
      normal: biomarkers.filter(b => b.status === 'NORMAL').length,
      high: biomarkers.filter(b => b.status === 'HIGH').length,
      low: biomarkers.filter(b => b.status === 'LOW').length
    };
  };

  const healthMetrics = calculateHealthScore();
  const statusCounts = getStatusCounts();

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

  return (
    <div className="dashboard-page">
      <Navbar user={user} logout={logout} />
      <div className="container">
        {/* Welcome Section */}
        <div className="welcome-card">
          <div className="welcome-content">
            <div className="welcome-icon">👋</div>
            <div>
              <h2 className="welcome-title">Welcome back</h2>
              <h1 className="welcome-name">{user?.email?.split('@')[0] || 'User'}</h1>
              <p className="welcome-subtitle">Here's your latest health insights.</p>
            </div>
          </div>
          <div className="welcome-date">
            <span className="date-icon">📅</span>
            <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Overall Health Score */}
        <div className="health-score-card">
          <h3 className="health-score-title">Overall Health Score</h3>
          <div className="health-score-content">
            <div className="health-score-value">
              <span className="score-number">{healthMetrics.score}%</span>
              <span className="score-label">({healthMetrics.normal} of {healthMetrics.total} normal)</span>
            </div>
            <div className="health-score-battery">
              <div 
                className="battery-fill" 
                style={{ width: `${healthMetrics.score}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon total">📊</div>
            <div className="summary-label">Total Tests</div>
            <div className="summary-value">{statusCounts.total}</div>
          </div>
          <div className="summary-card">
            <div className="summary-icon normal">✅</div>
            <div className="summary-label">Normal</div>
            <div className="summary-value">{statusCounts.normal}</div>
          </div>
          <div className="summary-card">
            <div className="summary-icon high">📈</div>
            <div className="summary-label">High</div>
            <div className="summary-value">{statusCounts.high}</div>
          </div>
          <div className="summary-card">
            <div className="summary-icon low">📉</div>
            <div className="summary-label">Low</div>
            <div className="summary-value">{statusCounts.low}</div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="reports-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-icon">📄</span>
              Recent Reports
            </h2>
            <p className="section-subtitle">Select a report to view details</p>
          </div>
          {reports.length === 0 ? (
            <div className="empty-state-card">
              <p>No reports yet. Upload your first lab report to get started!</p>
              <Link to="/upload" className="btn btn-primary">
                Upload Report
              </Link>
            </div>
          ) : (
            <div className="reports-grid">
              {reports.slice(0, 3).map((report, index) => {
                const normalCount = report.biomarkers.filter(b => b.status === 'NORMAL').length;
                const abnormalCount = report.biomarkers.filter(b => b.status !== 'NORMAL').length;
                const normalPercent = report.biomarkers.length > 0 
                  ? (normalCount / report.biomarkers.length) * 100 
                  : 0;
                
                return (
                  <div key={report._id} className={`report-card-wrapper ${index === 0 ? 'highlighted' : ''}`}>
                    <Link 
                      to={`/biomarker/${report._id}`}
                      className="report-card"
                    >
                      <div className="report-card-header">
                        <div className="report-icon">📄</div>
                        <div className="report-date">
                          {new Date(report.reportDate).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                      </div>
                      <div className="report-filename">
                        {report.fileName || `blood test ${new Date(report.reportDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase()}.pdf`}
                      </div>
                      <div className="report-stats">
                        <div className="report-stat normal-stat">
                          <span className="stat-icon">✅</span>
                          <span>{normalCount} Normal</span>
                        </div>
                        <div className="report-stat attention-stat">
                          <span className="stat-icon">⚠️</span>
                          <span>{abnormalCount} Attention</span>
                        </div>
                      </div>
                      <div className="report-progress">
                        <div 
                          className="progress-bar"
                          style={{ 
                            width: `${normalPercent}%`,
                            backgroundColor: normalPercent >= 70 ? '#10b981' : normalPercent >= 50 ? '#f59e0b' : '#ef4444'
                          }}
                        ></div>
                      </div>
                      {report.retestRecommendation && (
                        <div className="report-retest">
                          Suggested to retest after <span className="retest-highlight">{report.retestRecommendation}</span>
                        </div>
                      )}
                    </Link>
                    <button
                      className="report-delete-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
                          handleDeleteReport(report._id);
                        }
                      }}
                      aria-label="Delete report"
                      title="Delete report"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Needs Attention */}
        {abnormalBiomarkers.length > 0 && (
          <div className="attention-section">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">💡</span>
                Needs Attention
              </h2>
              <p className="section-subtitle">
                {abnormalBiomarkers.length} biomarker{abnormalBiomarkers.length !== 1 ? 's' : ''} outside normal range
              </p>
            </div>
            <Link to="/summary" className="btn btn-primary">
              View Doctor Summary
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

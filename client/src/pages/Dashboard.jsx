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
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      await apiService.deleteReport(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report');
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

  return (
    <div>
      <Navbar user={user} logout={logout} />
      <div className="container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <Link to="/upload" className="btn btn-primary">
            Upload New Report
          </Link>
        </div>

        {abnormalBiomarkers.length > 0 && (
          <div className="card alert-card">
            <h2>⚠️ Abnormal Biomarkers</h2>
            <p>You have {abnormalBiomarkers.length} abnormal biomarker(s) requiring attention.</p>
            <Link to="/summary" className="btn btn-primary">
              View Doctor Summary
            </Link>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Reports</h3>
            <p className="stat-number">{reports.length}</p>
          </div>
          <div className="stat-card">
            <h3>Abnormal Values</h3>
            <p className="stat-number">{abnormalBiomarkers.length}</p>
          </div>
          <div className="stat-card">
            <h3>Latest Report</h3>
            <p className="stat-date">
              {reports.length > 0
                ? new Date(reports[0].reportDate).toLocaleDateString()
                : 'No reports'}
            </p>
          </div>
        </div>

        <div className="card">
          <h2>Recent Reports</h2>
          {reports.length === 0 ? (
            <div className="empty-state">
              <p>No reports yet. Upload your first lab report to get started!</p>
              <Link to="/upload" className="btn btn-primary">
                Upload Report
              </Link>
            </div>
          ) : (
            <div className="reports-list">
              {reports.map((report) => (
                <div key={report._id} className="report-item">
                  <div className="report-info">
                    <h3>
                      Report - {new Date(report.reportDate).toLocaleDateString()}
                    </h3>
                    <p>
                      {report.biomarkers.length} biomarker(s) •{' '}
                      {report.biomarkers.filter((b) => b.status !== 'NORMAL').length}{' '}
                      abnormal
                    </p>
                  </div>
                  <div className="report-actions">
                    <Link
                      to={`/biomarker/${report._id}`}
                      className="btn btn-primary"
                    >
                      View Details
                    </Link>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteReport(report._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="quick-links">
          <Link to="/trends" className="btn btn-secondary">
            View Trends
          </Link>
          <Link to="/summary" className="btn btn-secondary">
            Doctor Summary
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


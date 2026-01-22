import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import Navbar from '../components/Navbar';
import './UploadReport.css';

const UploadReport = () => {
  const { user, logout } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadStep, setUploadStep] = useState(0); // 0: upload, 1: extraction, 2: analysis, 3: insights
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF or image file (JPEG, PNG, GIF)');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setUploadStep(1); // Start extraction

    try {
      // Simulate step progression
      setTimeout(() => setUploadStep(2), 1000); // Analysis step
      
      const response = await apiService.uploadReport(file);
      
      setUploadStep(3); // Insights ready
      setTimeout(() => {
        navigate(`/biomarker/${response.report.id}`);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload report');
      setUploadStep(0);
      setLoading(false);
    }
  };

  const steps = [
    { id: 0, label: 'Upload Report', sublabel: 'PDF or image file', icon: '📤' },
    { id: 1, label: 'AI Extraction', sublabel: 'Extract biomarkers', icon: '🔍' },
    { id: 2, label: 'Analysis', sublabel: 'Detect abnormalities', icon: '📊' },
    { id: 3, label: 'Insights', sublabel: 'Get recommendations', icon: '💡' }
  ];

  return (
    <div className="upload-page">
      <Navbar user={user} logout={logout} />
      <div className="container">
        <div className="upload-header">
          <div className="ai-badge">AI-Powered Analysis</div>
          <h1 className="upload-title">Upload Lab Report</h1>
          <p className="upload-subtitle">
            Upload your blood test report and our AI will extract and analyze your biomarkers with clinical precision
          </p>
        </div>

        {/* Process Flow */}
        <div className="process-flow">
          {steps.map((step, index) => (
            <div key={step.id} className="process-step-wrapper">
              <div className={`process-step ${uploadStep >= step.id ? 'completed' : ''} ${uploadStep === step.id ? 'active' : ''}`}>
                <div className="step-icon">
                  {uploadStep > step.id ? '✅' : step.icon}
                </div>
                <div className="step-label">{step.label}</div>
                <div className="step-sublabel">{step.sublabel}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`step-connector ${uploadStep > step.id ? 'completed' : ''}`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Upload Form or Analysis Status */}
        {uploadStep === 0 ? (
          <div className="upload-card">
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} className="upload-form">
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="file-input"
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileChange}
                  className="file-input"
                  disabled={loading}
                />
                <label htmlFor="file-input" className="file-label">
                  <div className="file-icon">📄</div>
                  <div>
                    <div className="file-label-text">
                      {file ? file.name : 'Choose File (PDF or Image)'}
                    </div>
                    <div className="file-label-hint">
                      Click to browse or drag and drop
                    </div>
                  </div>
                </label>
              </div>
              {file && (
                <div className="file-preview">
                  <p><strong>Selected:</strong> {file.name}</p>
                  <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary upload-btn"
                disabled={loading || !file}
              >
                {loading ? 'Processing...' : 'Upload & Analyze'}
              </button>
            </form>
          </div>
        ) : uploadStep === 1 || uploadStep === 2 ? (
          <div className="analysis-status">
            <div className="analysis-icon">📊</div>
            <h2 className="analysis-title">
              {uploadStep === 1 ? 'Extracting biomarkers...' : 'Analyzing biomarker levels...'}
            </h2>
            <p className="analysis-subtitle">
              {uploadStep === 1 
                ? 'Using AI vision to read your report' 
                : 'Comparing against reference ranges'}
            </p>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill"
                style={{ width: `${(uploadStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default UploadReport;

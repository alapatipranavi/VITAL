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
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF or image file (JPEG, PNG, GIF)');
        return;
      }
      // Validate file size (10MB)
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

    try {
      const response = await apiService.uploadReport(file);
      alert('Report uploaded and processed successfully!');
      navigate(`/biomarker/${response.report.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar user={user} logout={logout} />
      <div className="container">
        <h1>Upload Lab Report</h1>
        <div className="card">
          <p className="upload-info">
            Upload a PDF or image of your lab report. Our AI will extract biomarker
            values and provide personalized insights.
          </p>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="file-input-wrapper">
              <input
                type="file"
                id="file-input"
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="file-input" className="file-label">
                {file ? file.name : 'Choose File (PDF or Image)'}
              </label>
            </div>
            {file && (
              <div className="file-preview">
                <p>Selected: {file.name}</p>
                <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !file}
            >
              {loading ? 'Processing...' : 'Upload & Analyze'}
            </button>
          </form>
          <div className="upload-tips">
            <h3>Tips for best results:</h3>
            <ul>
              <li>Ensure the report is clear and readable</li>
              <li>Make sure all text is visible and not cut off</li>
              <li>Use high-quality images or PDFs</li>
              <li>Common formats: PDF, JPEG, PNG</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadReport;


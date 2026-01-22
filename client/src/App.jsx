import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadReport from './pages/UploadReport';
import BiomarkerDetails from './pages/BiomarkerDetails';
import Trends from './pages/Trends';
import DoctorSummary from './pages/DoctorSummary';
import PrivateRoute from './components/PrivateRoute';
import DisclaimerBanner from './components/DisclaimerBanner';

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <DisclaimerBanner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <PrivateRoute>
                <UploadReport />
              </PrivateRoute>
            }
          />
          <Route
            path="/biomarker/:reportId"
            element={
              <PrivateRoute>
                <BiomarkerDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/trends"
            element={
              <PrivateRoute>
                <Trends />
              </PrivateRoute>
            }
          />
          <Route
            path="/summary"
            element={
              <PrivateRoute>
                <DoctorSummary />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;


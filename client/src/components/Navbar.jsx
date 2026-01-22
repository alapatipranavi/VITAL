import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, logout }) => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <div className="logo-icon">❤️</div>
          <div className="logo-text">
            <span className="logo-name">VitalSense</span>
            <span className="logo-subtitle">Healthcare Analytics</span>
          </div>
        </Link>
        <div className="navbar-menu">
          <Link 
            to="/dashboard" 
            className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </Link>
          <Link 
            to="/upload" 
            className={`navbar-link ${location.pathname === '/upload' ? 'active' : ''}`}
          >
            <span className="nav-icon">📤</span>
            Upload Report
          </Link>
          <Link 
            to="/trends" 
            className={`navbar-link ${location.pathname === '/trends' ? 'active' : ''}`}
          >
            <span className="nav-icon">📈</span>
            Trends
          </Link>
          <Link 
            to="/summary" 
            className={`navbar-link ${location.pathname === '/summary' ? 'active' : ''}`}
          >
            <span className="nav-icon">📋</span>
            Summary
          </Link>
          <Link 
            to="/profile" 
            className={`navbar-link ${location.pathname === '/profile' ? 'active' : ''}`}
          >
            <span className="nav-icon">👤</span>
            Profile
          </Link>
          <div className="navbar-status">
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span>Connected</span>
            </div>
            <div className="user-icon">👤</div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

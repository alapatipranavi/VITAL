import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, logout }) => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          VitalSense
        </Link>
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link">
            Dashboard
          </Link>
          <Link to="/upload" className="navbar-link">
            Upload
          </Link>
          <Link to="/trends" className="navbar-link">
            Trends
          </Link>
          <Link to="/summary" className="navbar-link">
            Summary
          </Link>
          <div className="navbar-user">
            <span>{user?.email}</span>
            <button onClick={logout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


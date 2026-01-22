import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="profile-page">
      <Navbar user={user} logout={logout} />
      <div className="container">
        <div className="profile-header">
          <h1>Profile</h1>
        </div>
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-icon">👤</div>
          </div>
          <div className="profile-info">
            <h2>{user?.email?.split('@')[0] || 'User'}</h2>
            <p className="profile-email">{user?.email}</p>
          </div>
          <div className="profile-actions">
            <button className="btn btn-secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

import React from 'react';

const ProfileHeader = ({ onBackClick }) => {
  return (
    <div className="profile-header-nav">
      <button onClick={onBackClick} className="back-btn-simple">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h3>Profile</h3>
    </div>
  );
};

export default ProfileHeader;

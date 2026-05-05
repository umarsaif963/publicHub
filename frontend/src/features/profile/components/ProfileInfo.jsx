import React from 'react';

const ProfileInfo = ({ 
  profile, 
  isOwnProfile, 
  isEditing, 
  editName, 
  setEditName, 
  setIsEditing, 
  handleUpdateUsername, 
  handleAvatarClick, 
  fileInputRef, 
  handleFileChange, 
  baseUrl, 
  defaultAvatar 
}) => {
  return (
    <div className="profile-info-section">
      <div className="profile-avatar-wrapper">
        <img 
          src={profile.profilePic ? `${baseUrl}/uploads/${profile.profilePic}` : defaultAvatar} 
          alt="Avatar" 
          className="profile-avatar-large"
          onError={(e) => e.target.src = defaultAvatar}
        />
        {isOwnProfile && (
          <div className="avatar-edit-overlay" onClick={handleAvatarClick}>
            <span>+</span>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          hidden 
          accept="image/*" 
          onChange={handleFileChange} 
        />
      </div>

      <div className="profile-details">
        <div className="profile-name-row">
          {isEditing ? (
            <div className="edit-name-group">
              <input 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)}
                className="edit-input"
                autoFocus
              />
              <button onClick={handleUpdateUsername} className="save-btn">Save</button>
              <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
            </div>
          ) : (
            <>
              <h2>{profile.username}</h2>
              {isOwnProfile && (
                <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
              )}
            </>
          )}
        </div>

        <div className="profile-stats-row">
          <span><strong>{profile.postCount}</strong> posts</span>
          <span><strong>{profile.followersCount}</strong> followers</span>
          <span><strong>{profile.followingCount}</strong> following</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;

import React from 'react';

const PostPopup = ({ post, onClose, baseUrl }) => {
  if (!post) return null;

  return (
    <div className="post-popup-overlay" onClick={onClose}>
      <div className="post-popup-content glass" onClick={(e) => e.stopPropagation()}>
        <button className="close-popup-btn" onClick={onClose}>&times;</button>
        <div className="post-popup-body">
          <div className="post-popup-image-side">
            {post.image ? (
              <img src={`${baseUrl}/uploads/${post.image}`} alt="" />
            ) : (
              <div className="text-post-large">
                <p>{post.description}</p>
              </div>
            )}
          </div>
          <div className="post-popup-details-side">
            <div className="post-popup-header">
              <h3>{post.user?.username || 'User'}</h3>
            </div>
            <div className="post-popup-caption">
              <p><strong>{post.user?.username || 'User'}</strong> {post.description}</p>
            </div>
            <div className="post-popup-footer">
              <div className="post-popup-actions">
                <span>❤️ {post.likes?.length || 0} likes</span>
                <span>💬 {post.comments?.length || 0} comments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPopup;

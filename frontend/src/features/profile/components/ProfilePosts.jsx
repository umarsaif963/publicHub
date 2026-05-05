import React from 'react';

const ProfilePosts = ({ posts, onPostClick, baseUrl }) => {
  return (
    <div className="profile-posts-grid">
      {posts.length > 0 ? (
        posts.map(post => (
          <div key={post._id} className="grid-item" onClick={() => onPostClick(post)}>
            {post.image ? (
              <img src={`${baseUrl}/uploads/${post.image}`} alt="" />
            ) : (
              <div className="text-post-placeholder">
                <p>{post.description?.slice(0, 50)}...</p>
              </div>
            )}
            <div className="grid-item-overlay">
              <span>❤️ {post.likes?.length || 0}</span>
              <span>💬 {post.comments?.length || 0}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="no-posts-yet">No posts yet</div>
      )}
    </div>
  );
};

export default ProfilePosts;

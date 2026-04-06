import { useState, useEffect, useRef } from "react";
import { useSocket } from "../../../context/SocketContext";
import { getFeedStories, getMyStories, createStory } from "../services/storyService";
import StoryViewer from "./StoryViewer";
import "../../feed/styles/feed.css";

const StoriesBar = ({ currentUser }) => {
  const socket = useSocket();
  const [storiesData, setStoriesData] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    try {
      const [feedStories, userStories] = await Promise.all([
        getFeedStories(),
        getMyStories()
      ]);
      setStoriesData(feedStories);
      setMyStories(userStories);
    } catch (err) {
      console.error("Failed to fetch stories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewStory = (story) => {
      setStoriesData(prev => {
        const userIndex = prev.findIndex(u => u.user._id === story.user._id);
        if (userIndex >= 0) {
          const updated = [...prev];
          updated[userIndex] = {
            ...updated[userIndex],
            stories: [story, ...updated[userIndex].stories]
          };
          return updated;
        }
        return [{ user: story.user, stories: [story] }, ...prev];
      });
      
      setMyStories(prev => [story, ...prev]);
    };

    socket.on("newStory", handleNewStory);
    return () => socket.off("newStory", handleNewStory);
  }, [socket]);

  const handleOpenStory = (userStories, startIndex = 0) => {
    setActiveStory({ userStories, currentIndex: startIndex });
  };

  const handleCloseViewer = () => {
    setActiveStory(null);
  };

  const handleCreateStory = () => {
    console.log("=== handleCreateStory called ===");
    console.log("currentUser:", currentUser);
    console.log("showCreateModal before:", showCreateModal);
    setShowCreateModal(true);
    console.log("showCreateModal after set:", true);
  };

  const handleStoryCreated = () => {
    setShowCreateModal(false);
    fetchStories();
  };

  const hasActiveStories = storiesData.length > 0 || myStories.length > 0;

  if (loading) {
    return (
      <div className="stories-bar glass">
        <div className="stories-container">
          <div className="story-ring add-story" style={{ opacity: 0.5, pointerEvents: 'none' }}>
            <div className="add-story-icon">
              <div className="loading-spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentUserStories = myStories.length > 0 
    ? [{ user: currentUser, stories: myStories, isCurrentUser: true }]
    : [{ user: currentUser, stories: [], isCurrentUser: true, noStories: true }];

  const allUsers = [...currentUserStories, ...storiesData];

  return (
    <div className="stories-bar glass">
      <div className="stories-container">
        {allUsers.map((userStory, index) => (
          <StoryRing
            key={userStory.user._id}
            user={userStory.user}
            stories={userStory.stories}
            isCurrentUser={userStory.isCurrentUser}
            onClick={() => handleOpenStory(userStory.stories)}
            onCreateClick={handleCreateStory}
            currentUserId={currentUser?.id}
            noStories={userStory.noStories}
          />
        ))}
      </div>

      {activeStory && (
        <StoryViewer
          userStories={activeStory.userStories}
          currentIndex={activeStory.currentIndex}
          onClose={handleCloseViewer}
          onNext={() => setActiveStory(prev => ({
            ...prev,
            currentIndex: Math.min(prev.currentIndex + 1, prev.userStories.length - 1)
          }))}
          onPrev={() => setActiveStory(prev => ({
            ...prev,
            currentIndex: Math.max(prev.currentIndex - 1, 0)
          }))}
          currentUserId={currentUser?.id}
        />
      )}

      {showCreateModal && (
        <CreateStoryModal onClose={() => setShowCreateModal(false)} onSuccess={handleStoryCreated} />
      )}
    </div>
  );
};

const StoryRing = ({ user, stories, isCurrentUser, onClick, onCreateClick, currentUserId, noStories }) => {
  const hasUnviewed = stories.some(s => !s.viewers?.some(v => v._id === currentUserId || v === currentUserId));
  
  if (isCurrentUser && noStories) {
    return (
      <button 
        className="story-ring add-story"
        onClick={onCreateClick}
        title="Create your story"
      >
        <div className="add-story-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <span className="story-username">Your Story</span>
      </button>
    );
  }
  
  return (
    <button 
      className={`story-ring ${hasUnviewed ? 'has-story' : ''} ${isCurrentUser ? 'current-user' : ''}`}
      onClick={isCurrentUser ? onCreateClick : onClick}
      title={`${user.username}'s story`}
    >
      <img 
        src={user.profilePic ? `http://localhost:3001/uploads/${user.profilePic}` : "https://e7.pngegg.com/pngimages/954/550/png-clipart-silhouette-silhouette-animals-head.png"} 
        alt={user.username}
        className="story-avatar"
        onError={(e) => e.target.src = "https://e7.pngegg.com/pngimages/954/550/png-clipart-silhouette-silhouette-animals-head.png"}
      />
      <span className="story-username">{isCurrentUser ? 'Your Story' : user.username}</span>
    </button>
  );
};

const CreateStoryModal = ({ onClose, onSuccess }) => {
  console.log("=== CreateStoryModal rendering ===");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mediaFile) return;
    
    setLoading(true);
    try {
      await createStory(mediaFile, mediaType);
      onSuccess();
    } catch (err) {
      console.error("Failed to create story:", err);
      alert("Failed to create story");
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => fileInputRef.current?.click();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal create-story-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Story</h3>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="story-preview-area" onClick={handleImageClick}>
            {preview ? (
              mediaType === 'video' ? (
                <video src={preview} controls autoPlay muted />
              ) : (
                <img src={preview} alt="Preview" />
              )
            ) : (
              <div className="upload-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>Tap to add photo/video</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*,video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!mediaFile || loading}>
              {loading ? 'Posting...' : 'Share Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoriesBar;
import { useState, useEffect, useRef } from "react";
import { viewStory } from "../services/storyService";

const StoryViewer = ({ 
  userStories, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev,
  currentUserId 
}) => {
const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef(null);
  const storyDuration = 5000;
  const viewedStoriesRef = useRef(new Set());

  const currentStory = userStories[currentIndex];
  const isLastStory = currentIndex === userStories.length - 1;
  const isOwnStory = currentStory?.user._id === currentUserId;

  // Guard clause for missing story data
  if (!currentStory) {
    useEffect(() => {
      onClose();
    }, []);
    return null;
  }

  useEffect(() => {
    if (currentStory && !viewedStoriesRef.current.has(currentStory._id)) {
      viewedStoriesRef.current.add(currentStory._id);
      viewStory(currentStory._id, currentUserId).catch(console.error);
    }
    
    setProgress(0);
    setIsPaused(false);
    animateProgress();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentIndex, currentStory]);

  const animateProgress = () => {
    const startTime = Date.now();
    const initialProgress = progress;
    
    const animate = () => {
      if (isPaused) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(initialProgress + (elapsed / storyDuration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress < 100) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        if (isLastStory) {
          onClose();
        } else {
          onNext();
        }
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const handleMouseDown = () => setIsPaused(true);
  const handleMouseUp = () => setIsPaused(false);
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'Escape') onClose();
    if (e.key === ' ') { e.preventDefault(); setIsPaused(!isPaused); }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const timeLeft = Math.ceil((100 - progress) / 100 * (storyDuration / 1000));
  const isVideo = currentStory?.mediaType === 'video';

  return (
    <div 
      className="story-viewer-overlay"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      <div className="story-viewer">
        <div className="story-header">
          <div className="story-user-info" onClick={() => window.location.href = `/profile/${currentStory.user._id}`}>
            <img 
              src={currentStory.user.profilePic ? `http://localhost:3001/uploads/${currentStory.user.profilePic}` : "https://e7.pngegg.com/pngimages/954/550/png-clipart-silhouette-silhouette-animals-head.png"} 
              alt={currentStory.user.username}
              className="story-viewer-avatar"
              onError={(e) => e.target.src = "https://e7.pngegg.com/pngimages/954/550/png-clipart-silhouette-silhouette-animals-head.png"}
            />
            <div>
              <span className="story-viewer-username">{currentStory.user.username}</span>
              <span className="story-time">{timeLeft}s</span>
            </div>
          </div>
          
          <div className="story-progress-container">
            {userStories.map((_, i) => (
              <div key={i} className="story-progress-bar">
                <div 
                  className="story-progress-fill"
                  style={{ 
                    width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                    transition: i === currentIndex && !isPaused ? 'width 0.1s linear' : 'none'
                  }}
                />
              </div>
            ))}
          </div>
          
          <button className="close-story-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="story-content" onClick={isLastStory ? onClose : onNext} onContextMenu={e => e.preventDefault()}>
          <div className="story-nav">
            <button className="nav-btn prev" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Previous">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button className="nav-btn next" onClick={(e) => { e.stopPropagation(); isLastStory ? onClose() : onNext(); }} aria-label="Next">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          {isVideo ? (
            <video 
              src={`http://localhost:3001/uploads/${currentStory.media}`}
              autoPlay
              muted
              loop
              playsInline
              className="story-media"
            />
          ) : (
            <img 
              src={`http://localhost:3001/uploads/${currentStory.media}`}
              alt="Story"
              className="story-media"
            />
          )}

          {isOwnStory && (
            <div className="story-viewer-count">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span>{currentStory.viewers?.length || 0} views</span>
            </div>
          )}
        </div>

        <div className="story-footer">
          <div className="story-reply">
            <input 
              type="text" 
              placeholder="Send message..." 
              className="story-reply-input"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
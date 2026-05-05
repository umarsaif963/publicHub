import { useState, useEffect, useContext, useCallback, memo } from "react";
import { AuthContext } from "../../auth/context/AuthContext";
import { toggleLike, deletePost, editPost } from "../services/postService";
import { 
  getComments, 
  createComment, 
  deleteComment, 
  likeComment, 
  editComment, 
  replyToComment 
} from "../services/commentService";
import { toggleFollow } from "../../auth/services/userService";
import { useSocket } from "../../../context/SocketContext";
import "../styles/feed.css";

const PostCard = memo(({ post, onPostDelete, onPostUpdate }) => {
  const { user } = useContext(AuthContext);
  const socket = useSocket();
  
  const isOwner = user?.id === post.user?._id;

  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?.id));
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(user?.following?.includes(post.user?._id));
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(post.description);

  const baseUrl = "http://localhost:3001";
  const defaultAvatar = "https://e7.pngegg.com/pngimages/954/550/png-clipart-silhouette-silhouette-animals-head.png";

  useEffect(() => {
    setLikeCount(post.likeCount || 0);
    setIsLiked(post.likes?.includes(user?.id));
    setIsFollowing(user?.following?.includes(post.user?._id));
  }, [post.likeCount, post.likes, post.user?._id, user?.id, user?.following]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await getComments(post._id);
        setComments(data);
      } catch (err) {
        console.error("DEBUG: Error fetching comments:", err.message);
      }
    };
    fetchComments();
  }, [post._id]);

  useEffect(() => {
    if (!socket) return;

    const handleNewComment = (comment) => {
      if (comment.post === post._id) {
        setComments((prev) => {
          if (prev.find(c => c._id === comment._id)) return prev;
          return [comment, ...prev];
        });
      }
    };

    const handleFollowUpdate = (data) => {
      if (data.targetId === post.user?._id) {
        setIsFollowing(data.isFollowing);
      }
    };

    socket.on("newComment", handleNewComment);
    socket.on("followUpdate", handleFollowUpdate);

    return () => {
      socket.off("newComment", handleNewComment);
      socket.off("followUpdate", handleFollowUpdate);
    };
  }, [socket, post._id, post.user?._id]);

  const handleLike = useCallback(async () => {
    try {
      await toggleLike(post._id);
      setIsLiked(prev => !prev);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (err) {
      console.error("DEBUG: Like error:", err.message);
    }
  }, [post._id, isLiked]);

  const handleFollow = useCallback(async () => {
    try {
      const res = await toggleFollow(post.user?._id);
      setIsFollowing(res.isFollowing);
    } catch (err) {
      console.error("DEBUG: Follow error:", err.message);
    }
  }, [post.user?._id]);

  const handleCommentSubmit = useCallback(async (e) => {
    e.preventDefault();
    const trimmedText = commentText.trim();
    if (!trimmedText) return;

    try {
      const newComment = await createComment(post._id, trimmedText);
      setComments(prev => [newComment, ...prev]);
      setCommentText("");
      setShowCommentInput(false);
    } catch (err) {}
  }, [post._id, commentText]);

  const handleDeletePost = useCallback(async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deletePost(post._id);
        onPostDelete(post._id);
      } catch (err) {}
    }
  }, [post._id, onPostDelete]);

  const handleEditSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("description", editDescription);
      const updatedPost = await editPost(post._id, formData);
      onPostUpdate(updatedPost);
      setIsEditing(false);
      setShowMenu(false);
    } catch (err) {}
  }, [post._id, editDescription, onPostUpdate]);

  const handleDeleteComment = useCallback(async (commentId) => {
    if (window.confirm("Delete this comment?")) {
      try {
        await deleteComment(commentId);
        setComments(prev => prev.filter(c => c._id !== commentId));
      } catch (err) {}
    }
  }, []);

  return (
    <div className="post-card glass">
      <div className="post-header">
        <div className="post-user-info">
          <img 
            src={post.user?.profilePic ? `${baseUrl}/uploads/${post.user.profilePic}` : defaultAvatar} 
            alt="Avatar" 
            className="avatar-sm" 
            onError={(e) => e.target.src = defaultAvatar}
          />
          <span className="post-username">{post.user?.username}</span>
        </div>
        
        <div className="post-header-actions">
          {isOwner ? (
            <div className="menu-container">
              <button className="post-more-btn" onClick={() => setShowMenu(!showMenu)}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><circle cx="12" cy="12" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>
              </button>
              {showMenu && (
                <div className="post-menu glass">
                  <button onClick={() => setIsEditing(true)}>Edit Post</button>
                  <button className="delete-btn" onClick={handleDeletePost}>Delete Post</button>
                </div>
              )}
            </div>
          ) : (
            <button 
              className={`follow-btn ${isFollowing ? 'following' : ''}`} 
              onClick={handleFollow}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>

      <div className="post-image-container">
        {post.image && (
          <img src={`${baseUrl}/uploads/${post.image}`} alt="Post" className="post-image" loading="lazy" />
        )}
      </div>

      <div className="post-actions">
        <div className="action-left">
          <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill={isLiked ? "red" : "none"} stroke={isLiked ? "red" : "currentColor"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <button className="action-btn" onClick={() => setShowCommentInput(!showCommentInput)}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.5 8.5 0 0 1 4.7 1.4L22 3z"/></svg>
            {comments.length > 0 && <span className="action-count">{comments.length}</span>}
          </button>
        </div>
      </div>

      <div className="post-content">
        {likeCount > 0 && <p className="likes-count">{likeCount} likes</p>}
        
        {isEditing ? (
          <form className="edit-form" onSubmit={handleEditSubmit}>
            <textarea 
              value={editDescription} 
              onChange={(e) => setEditDescription(e.target.value)}
              className="edit-input glass"
            />
            <div className="edit-actions">
              <button type="submit" className="btn-save">Save</button>
              <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <p className="post-description">
            <span className="post-username-bold">{post.user?.username}</span> {post.description}
          </p>
        )}
        
        <div className="comments-section">
          {comments.length > 2 && !showAllComments && (
            <button className="view-all-btn" onClick={() => setShowAllComments(true)}>
              View all {comments.length} comments
            </button>
          )}
          
          {(showAllComments ? comments : comments.slice(0, 2)).map(comment => (
            <CommentItem 
              key={comment._id} 
              comment={comment} 
              postId={post._id}
              currentUser={user}
              postOwnerId={post.user?._id}
              onCommentUpdate={(updated) => setComments(prev => prev.map(c => c._id === updated._id ? updated : c))}
              onCommentDelete={(id) => setComments(prev => prev.filter(c => c._id !== id))}
            />
          ))}
        </div>

        {showCommentInput && (
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <input 
              type="text" 
              placeholder="Add a comment..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              autoFocus
            />
            <button type="submit" disabled={!commentText.trim()}>Post</button>
          </form>
        )}
      </div>
    </div>
  );
});

const CommentItem = ({ comment, postId, currentUser, postOwnerId, onCommentUpdate, onCommentDelete }) => {
  const [isLiked, setIsLiked] = useState(comment.likes?.includes(currentUser?.id));
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const isOwner = currentUser?.id === comment.user?._id;
  const canDelete = isOwner || currentUser?.id === postOwnerId;

  const handleLike = async () => {
    try {
      const updated = await likeComment(comment._id);
      setIsLiked(!isLiked);
      onCommentUpdate(updated);
    } catch (err) {}
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      const updated = await replyToComment(comment._id, replyText);
      onCommentUpdate(updated);
      setReplyText("");
      setShowReplyInput(false);
    } catch (err) {}
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await editComment(comment._id, editText);
      onCommentUpdate(updated);
      setIsEditing(false);
    } catch (err) {}
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this comment?")) {
      try {
        await deleteComment(comment._id);
        onCommentDelete(comment._id);
      } catch (err) {}
    }
  };

  return (
    <div className="comment-wrapper">
      <div className="comment-main">
        <div className="comment-content-box">
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="mini-edit-form">
              <input value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
              <button type="submit">Save</button>
            </form>
          ) : (
            <p>
              <span className="comment-username">{comment.user?.username}</span> {comment.text}
            </p>
          )}
          
          <div className="comment-actions-row">
            <span>{comment.likeCount || 0} likes</span>
            <button onClick={() => setShowReplyInput(!showReplyInput)}>Reply</button>
            {isOwner && <button onClick={() => setIsEditing(!isEditing)}>Edit</button>}
            {canDelete && <button onClick={handleDelete} className="del-text">Delete</button>}
          </div>
        </div>
        
        <button className={`comment-like-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill={isLiked ? "red" : "none"} stroke={isLiked ? "red" : "currentColor"}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>

      {comment.replies?.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => (
            <div key={reply._id} className="reply-item">
              <p><span className="comment-username">{reply.user?.username}</span> {reply.text}</p>
            </div>
          ))}
        </div>
      )}

      {showReplyInput && (
        <form className="reply-form" onSubmit={handleReplySubmit}>
          <input 
            placeholder={`Reply to ${comment.user?.username}...`} 
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            autoFocus
          />
          <button type="submit" className="reply-post-btn" disabled={!replyText.trim()}>Post</button>
        </form>
      )}
    </div>
  );
};

export default PostCard;

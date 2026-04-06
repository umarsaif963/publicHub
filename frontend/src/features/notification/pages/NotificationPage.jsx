import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAsRead } from "../services/notificationService";
import { useSocket } from "../../../context/SocketContext";
import "../../feed/styles/feed.css";

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const navigate = useNavigate();
  const baseUrl = "http://localhost:3001";
  const defaultAvatar = "https://e7.pngegg.com/pngimages/954/550/png-clipart-silhouette-silhouette-animals-head.png";

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("DEBUG: Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    markAsRead();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewNotif = (newNotif) => {
      console.log("DEBUG: New real-time notification received:", newNotif);
      setNotifications((prev) => [newNotif, ...prev]);
    };

    socket.on("notification", handleNewNotif);
    return () => socket.off("notification", handleNewNotif);
  }, [socket]);

  const renderNotifContent = (notif) => {
    const username = <span className="bold">{notif.sender?.username || "Someone"}</span>;
    
    switch (notif.type) {
      case "like":
        return <p>{username} liked your post</p>;
      case "comment":
        return (
          <div>
            <p>{username} commented: </p>
            <p className="comment-text-preview">"{notif.message || "Nice post!"}"</p>
          </div>
        );
      case "follow":
        return <p>{username} started following you</p>;
      case "post":
        return <p>{username} shared a new post</p>;
      default:
        return <p>{username} interacted with you</p>;
    }
  };

  const handlePostClick = (postId) => {
    if (postId) navigate(`/feed`); // Or a dedicated post view if available
  };

  return (
    <div className="notification-layout glass">
      <div className="notification-header">
        <button onClick={() => navigate("/feed")} className="back-btn">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h2>Notifications</h2>
      </div>

      <div className="notification-list">
        {loading ? (
          <div className="flex-center" style={{padding: '2rem'}}>
            <div className="loading-spinner"></div>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div key={notif._id || Math.random()} className="notification-item">
              {/* Left: Avatar */}
              <div className="notif-left">
                <img 
                  src={notif.sender?.profilePic ? `${baseUrl}/uploads/${notif.sender.profilePic}` : defaultAvatar} 
                  alt="Avatar" 
                  className="avatar-sm"
                  onError={(e) => e.target.src = defaultAvatar}
                />
              </div>

              {/* Center: Text */}
              <div className="notif-center">
                {renderNotifContent(notif)}
                <span className="notif-time">
                  {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : "Just now"}
                </span>
              </div>

              {/* Right: Post Preview (Thumbnail) */}
              <div className="notif-right">
                {notif.post && (
                  <div 
                    className="notif-preview clickable" 
                    onClick={() => handlePostClick(notif.post._id || notif.post)}
                    title="View post"
                  >
                    {notif.post.image ? (
                      <img src={`${baseUrl}/uploads/${notif.post.image}`} alt="Post" />
                    ) : (
                      <div className="text-preview-box">Post</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-notifications">
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;

import { useContext, useState, useEffect, useMemo, memo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../auth/context/AuthContext";
import { useSocket } from "../../../context/SocketContext";
// import { getNotifications } from "../../notification/services/notificationService";
import { getUnreadCount } from "../../messages/services/messageService";
import "../styles/feed.css";

const Navbar = memo(({ onUploadClick }) => {
  const { user, logout } = useContext(AuthContext);
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const notifs = await getNotifications();
        setUnreadCount(notifs.filter(n => !n.isRead).length);

        const { count } = await getUnreadCount();
        setMsgCount(count);
      } catch (err) {
        console.error(err);
      }
    };
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNotification = () => setUnreadCount(prev => prev + 1);
    const handleNewMessage = () => {
      if (location.pathname !== "/messages") {
        setMsgCount(prev => prev + 1);
      }
    };

    socket.on("notification", handleNotification);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, location.pathname]);

  useEffect(() => {
    if (location.pathname === "/notification") setUnreadCount(0);
    if (location.pathname === "/messages") setMsgCount(0);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = useMemo(() => [
    { to: "/feed", label: "Home", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { to: "/search", label: "Search", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
    { action: onUploadClick, label: "Upload", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
    { 
      to: "/notification", 
      label: "Notification", 
      icon: (
        <div className="icon-badge-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
        </div>
      )
    },
    { 
      to: "/messages", 
      label: "Messages", 
      icon: (
        <div className="icon-badge-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          {msgCount > 0 && <span className="nav-badge">{msgCount}</span>}
        </div>
      )
    },
    { to: `/profile/${user?.id}`, label: "Profile", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ], [user?.id, unreadCount, msgCount, onUploadClick]);

  return (
    <nav className="sidebar glass">
      <div className="nav-menu">
        {navItems.map((item, index) => (
          item.to ? (
            <Link 
              key={index} 
              to={item.to} 
              className={`nav-item ${location.pathname === item.to ? "active" : ""}`}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </Link>
          ) : (
            <button 
              key={index} 
              className="nav-item" 
              onClick={item.action}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </button>
          )
        ))}
      </div>

      <div className="nav-footer">
        <button className="logout-btn nav-item" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span className="nav-label">Logout</span>
        </button>
      </div>

      <div className="sidebar-user" onClick={() => navigate(`/profile/${user?.id}`)}>
        <img 
          src={user?.profilePic ? `http://localhost:3001/uploads/${user.profilePic}` : "https://e7.pngegg.com/pngimages/954/550/png-clipart-silhouette-silhouette-animals-head.png"} 
          alt="Avatar" 
          className="avatar" 
          onError={(e) => e.target.src = "https://e7.pngegg.com/pngimages/954/550/png-clipart-silhouette-silhouette-animals-head.png"}
        />
        <span className="nav-label username">{user?.username}</span>
      </div>
    </nav>
  );
});

export default Navbar;

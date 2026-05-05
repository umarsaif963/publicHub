import { useState } from "react";
import { searchUsers } from "../services/messageService";

const ChatSidebar = ({ 
  user, 
  conversations, 
  selectedUser, 
  onSelectUser, 
  onBack, 
  baseUrl, 
  defaultAvatar 
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 1) {
      try {
        const data = await searchUsers(query);
        setSearchResults(data.filter(u => u._id !== user.id));
      } catch (err) {
        console.error(err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleUserClick = (u) => {
    onSelectUser(u);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="messages-sidebar">
      <div className="sidebar-header">
        <button onClick={onBack} className="back-btn-simple">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h3>Messages</h3>
      </div>

      <div className="search-container">
        <input 
          type="text" 
          placeholder="Search users..." 
          value={searchQuery}
          onChange={handleSearch}
          className="search-input-msg glass"
        />
        {searchResults.length > 0 && (
          <div className="search-results-msg glass">
            {searchResults.map(u => (
              <div key={u._id} className="search-item-msg" onClick={() => handleUserClick(u)}>
                <img src={u.profilePic ? `${baseUrl}/uploads/${u.profilePic}` : defaultAvatar} alt="" />
                <span>{u.username}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="conversations-list">
        {conversations.map(conv => (
          <div 
            key={conv.otherUser._id} 
            className={`conv-item ${selectedUser?._id === conv.otherUser._id ? 'active' : ''}`}
            onClick={() => onSelectUser(conv.otherUser)}
          >
            <img 
              src={conv.otherUser.profilePic ? `${baseUrl}/uploads/${conv.otherUser.profilePic}` : defaultAvatar} 
              alt="" 
              onError={(e) => e.target.src = defaultAvatar}
            />
            <div className="conv-info">
              <div className="conv-top">
                <span className="username">{conv.otherUser.username}</span>
                {conv.unreadCount > 0 && <span className="unread-badge">{conv.unreadCount}</span>}
              </div>
              <p className="last-msg">{conv.lastMessage}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;

import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";

const ChatWindow = ({
  selectedUser,
  messages,
  currentUserId,
  onSendMessage,
  baseUrl,
  defaultAvatar
}) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage("");
  };

  if (!selectedUser) {
    return (
      <div className="chat-window no-chat">
        <div className="no-chat-selected">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          <p>Select a user to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <img src={selectedUser.profilePic ? `${baseUrl}/uploads/${selectedUser.profilePic}` : defaultAvatar} alt="" />
        <h4>{selectedUser.username}</h4>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <MessageBubble key={msg._id || Math.random()} msg={msg} currentUserId={currentUserId} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" disabled={!newMessage.trim()}>Send</button>
      </form>
    </div>
  );
};

export default ChatWindow;

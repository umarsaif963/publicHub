const MessageBubble = ({ msg, currentUserId }) => {
  const isSentByMe = msg.sender === currentUserId || msg.sender?._id === currentUserId;

  return (
    <div className={`message-bubble ${isSentByMe ? 'sent' : 'received'}`}>
      <p>{msg.text}</p>
      <span className="msg-time">
        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};

export default MessageBubble;

import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../auth/context/AuthContext";
import { useSocket } from "../../../context/SocketContext";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead
} from "../services/messageService";

import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";

import "../../feed/styles/feed.css";
import "../styles/messages.css";

const MessagePage = () => {
  const { user } = useContext(AuthContext);
  const socket = useSocket();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const baseUrl = "http://localhost:3001";
  const defaultAvatar = "https://e7.pngegg.com/pngimages/954/550/png-clipart-silhouette-silhouette-animals-head.png";

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser._id);
      markAsRead(selectedUser._id);
      setConversations(prev => prev.map(c =>
        c.otherUser._id === selectedUser._id ? { ...c, unreadCount: 0 } : c
      ));
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      console.log("DEBUG: newMessage event received!", msg);

      const isFromSelected = selectedUser && msg.sender.toString() === selectedUser._id.toString();
      const isFromMe = msg.sender.toString() === user.id.toString();

      if (isFromSelected) {
        setMessages((prev) => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        markAsRead(selectedUser._id);
      } else if (!isFromMe) {
        fetchConversations();
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, selectedUser, user.id]);

  const fetchConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const data = await getMessages(userId);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (text) => {
    if (!selectedUser) return;
    try {
      const msg = await sendMessage(selectedUser._id, text);
      setMessages((prev) => [...prev, msg]);
      fetchConversations();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send message");
    }
  };

  return (
    <div className="messages-layout glass">
      <ChatSidebar
        user={user}
        conversations={conversations}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        onBack={() => navigate("/feed")}
        baseUrl={baseUrl}
        defaultAvatar={defaultAvatar}
      />

      <ChatWindow
        selectedUser={selectedUser}
        messages={messages}
        currentUserId={user.id}
        onSendMessage={handleSendMessage}
        baseUrl={baseUrl}
        defaultAvatar={defaultAvatar}
      />
    </div>
  );
};

export default MessagePage;

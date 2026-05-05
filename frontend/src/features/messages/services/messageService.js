import API from "../../../services/api";

export const getConversations = async () => {
  const response = await API.get("/messages/conversations");
  return response.data;
};

export const getMessages = async (userId) => {
  const response = await API.get(`/messages/conversation/${userId}`);
  return response.data;
};

export const sendMessage = async (receiverId, text) => {
  const response = await API.post("/messages", { receiverId, text });
  return response.data;
};

export const markAsRead = async (userId) => {
  const response = await API.put(`/messages/read/${userId}`);
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await API.get("/messages/unread-count");
  return response.data;
};

export const searchUsers = async (query) => {
  const response = await API.get(`/user/search?q=${query}`);
  return response.data;
};

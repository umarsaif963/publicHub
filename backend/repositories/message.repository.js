import Message from "../models/message.model.js";

export const createMessage = (data) => Message.create(data);

export const deleteMessageById = (messageId) => Message.findByIdAndDelete(messageId);

export const getConversation = (user1, user2) =>
  Message.find({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 },
    ],
  }).sort({ createdAt: 1 });

export const markMessagesAsRead = (senderId, receiverId) =>
  Message.updateMany(
    {
      sender: senderId,
      receiver: receiverId,
      isRead: false
    },
    { $set: { isRead: true } }
  ); 
import * as MessageRepo from "../repositories/message.repository.js";
import User from "../models/auth.model.js";
import Message from "../models/message.model.js";
import MessageRequest from "../models/messageRequest.model.js";

export const sendMessage = async (senderId, receiverId, text) => {
  const receiver = await User.findById(receiverId);
  if (!receiver) throw new Error("User not found");

  if (receiver.isPrivate) {
    const existingRequest = await MessageRequest.findOne({
      sender: senderId,
      receiver: receiverId,
    });

    if (!existingRequest || !existingRequest.isAccepted) {
      if (!existingRequest) {
        await MessageRequest.create({ sender: senderId, receiver: receiverId });
        throw new Error("Message request sent. Wait for approval.");
      }
      throw new Error("Your message request is still pending approval.");
    }
  }

  return await MessageRepo.createMessage({
    sender: senderId,
    receiver: receiverId,
    text
  });
};

export const getMessages = async (userId1, userId2) => {
  return await MessageRepo.getConversation(userId1, userId2);
};

export const handleRequest = async (receiverId, requestId, action) => {
  const request = await MessageRequest.findById(requestId);
  if (!request) throw new Error("Request not found");

  // ✅ FIX: toString() — ObjectId vs String comparison
  if (request.receiver.toString() !== receiverId.toString()) {
    throw new Error("Unauthorized action");
  }

  if (action === "accept") {
    request.isAccepted = true;
    await request.save();
    return { status: "accepted", message: "Request accepted." };
  } else if (action === "decline") {
    await MessageRequest.findByIdAndDelete(requestId);
    return { status: "declined", message: "Request declined." };
  }

  throw new Error("Invalid action");
};

export const markAsRead = async (currentUserId, otherUserId) => {
  // currentUserId = jo chat open kar raha hai (in = receiver of those messages)
  // otherUserId   = jis ne messages bheje the (sender)
  // ✅ markMessagesAsRead(sender, receiver) — sahi order
  const result = await MessageRepo.markMessagesAsRead(otherUserId, currentUserId);
  return result.modifiedCount;
};
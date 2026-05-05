import API from "../../../services/api";

export const getComments = async (postId) => {
  const response = await API.get(`/comment/${postId}`);
  return response.data;
};

export const createComment = async (postId, text) => {
  const response = await API.post(`/comment/${postId}`, { post: postId, text });
  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await API.delete(`/comment/${commentId}`);
  return response.data;
};

export const editComment = async (commentId, text) => {
  const response = await API.put(`/comment/${commentId}`, { text });
  return response.data;
};

export const likeComment = async (commentId) => {
  const response = await API.post(`/comment/${commentId}/like`);
  return response.data;
};

export const replyToComment = async (commentId, text) => {
  const response = await API.post(`/comment/${commentId}/reply`, { text });
  return response.data;
};

export const likeReply = async (commentId, replyId) => {
  const response = await API.post(`/comment/${commentId}/reply/${replyId}/like`);
  return response.data;
};

export const deleteReply = async (commentId, replyId) => {
  const response = await API.delete(`/comment/${commentId}/reply/${replyId}`);
  return response.data;
};

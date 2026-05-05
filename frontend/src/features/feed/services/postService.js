import API from "../../../services/api";

export const getPosts = async () => {
  const response = await API.get("/post");
  return response.data;
};

export const createPost = async (formData) => {
  const response = await API.post("/post", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const toggleLike = async (postId) => {
  const response = await API.put(`/post/like/${postId}`);
  return response.data;
};

export const deletePost = async (postId) => {
  const response = await API.delete(`/post/delete/${postId}`);
  return response.data;
};

export const editPost = async (postId, formData) => {
  const response = await API.put(`/post/edit/${postId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

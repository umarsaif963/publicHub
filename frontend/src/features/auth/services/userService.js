import API from "../../../services/api";

export const toggleFollow = async (userId) => {
  const response = await API.post(`/user/follow/${userId}`);
  return response.data;
};

export const getProfile = async (userId) => {
  const response = await API.get(`/user/profile/${userId}`);
  return response.data;
};

export const editProfile = async (formData) => {
  const response = await API.put("/user/edit", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const getUserPosts = async (userId) => {
  const response = await API.get(`/user/posts/${userId}`);
  return response.data;
};

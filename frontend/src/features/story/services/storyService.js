import API from "../../../services/api";

export const createStory = async (mediaFile, mediaType = 'image') => {
  const formData = new FormData();
  formData.append('media', mediaFile);
  formData.append('mediaType', mediaType);
  
  const response = await API.post('/story', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getFeedStories = async () => {
  const response = await API.get('/story/feed');
  return response.data;
};

export const getMyStories = async () => {
  const response = await API.get('/story/my-stories');
  return response.data;
};

export const getStoryCount = async (userId) => {
  const response = await API.get(`/story/count/${userId}`);
  return response.data;
};

export const viewStory = async (storyId) => {
  const response = await API.post(`/story/${storyId}/view`);
  return response.data;
};

export const deleteStory = async (storyId) => {
  const response = await API.delete(`/story/${storyId}`);
  return response.data;
};
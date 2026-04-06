import API from "../../../services/api";

export const getNotifications = async () => {
  const response = await API.get("/notification");
  return response.data;
};

export const markAsRead = async () => {
  const response = await API.put("/notification/read");
  return response.data;
};

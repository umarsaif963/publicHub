import API from "../../../services/api";

export const login = async (credentials) => {
  const response = await API.post("/user/login", credentials);
  return response.data;
};

export const signup = async (userData) => {
  const response = await API.post("/user/signup", userData);
  return response.data;
};

export const logout = async () => {
  const response = await API.post("/user/logout");
  return response.data;
};

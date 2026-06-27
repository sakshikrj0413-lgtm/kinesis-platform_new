import axios from "axios";

const socketUrl = import.meta.env.VITE_SOCKET_URL;
const baseURL = import.meta.env.VITE_API_URL || (socketUrl ? `${socketUrl}/api` : "http://127.0.0.1:5000/api");

const API = axios.create({
  baseURL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const token = localStorage.getItem("token");
      if (!token) {
        return Promise.reject(err);
      }
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(err);
  }
);

export default API;
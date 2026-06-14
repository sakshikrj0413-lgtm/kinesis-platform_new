import { create } from "zustand";
import { joinUserRoom, leaveUserRoom } from "../socket";

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  role: localStorage.getItem("role") || null,

  login: (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", user.role || "user");
    // Join the user's personal socket room for targeted events
    joinUserRoom(token);
    set({
      user,
      token,
      role: user.role || "user",
    });
  },

  logout: () => {
    const token = localStorage.getItem("token");
    leaveUserRoom(token);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    set({
      user: null,
      token: null,
      role: null,
    });
  },

  isAdmin: () => {
    return localStorage.getItem("role") === "admin";
  },
}));

// If user is already logged in (page refresh), rejoin their room
const existingToken = localStorage.getItem("token");
if (existingToken) {
  joinUserRoom(existingToken);
}

export default useAuthStore;

import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:5000", {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

/**
 * Call this once after a successful login/token refresh.
 * Puts the socket into the user's personal room so backend can
 * send targeted events (bet_settled, wallet_updated, transaction_added).
 */
export function joinUserRoom(token) {
  if (token) {
    socket.emit("join_user_room", { token });
  }
}

/**
 * Call on logout.
 */
export function leaveUserRoom(token) {
  if (token) {
    socket.emit("leave_user_room", { token });
  }
}

export default socket;

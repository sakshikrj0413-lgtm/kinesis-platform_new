import useAuthStore from "../store/authStore";

/** Returns JWT from auth store; null when logged out. */
export default function useAuthToken() {
  return useAuthStore((state) => state.token);
}

import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && role !== "admin") {
    return <Navigate to="/markets" />;
  }

  return children;
}

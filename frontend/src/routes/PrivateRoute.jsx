import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../services/authService";

export default function PrivateRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

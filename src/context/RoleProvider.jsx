import { Navigate } from "react-router-dom";

function RoleProvider({ role, children }) {
  const userData = localStorage.getItem("userData")
    ? JSON.parse(localStorage.getItem("userData"))
    : null;
  if (!userData) {
    return <Navigate to="/login" replace />;
  }
  if (userData?.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default RoleProvider;

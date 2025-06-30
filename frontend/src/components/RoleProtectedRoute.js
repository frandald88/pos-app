import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../apiConfig";

export default function RoleProtectedRoute({ children, allowedRoles }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(`${apiBaseUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCurrentUser(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return null;

  if (currentUser && allowedRoles.includes(currentUser.role)) {
    return children;
  }

  return <Navigate to="/admin/ventas" replace />;
}

import React from 'react';
import { Navigate } from 'react-router-dom';

function RoleProtectedRoute({ children, allowedRoles = [], redirectTo = '/401' }) {
  // Obtener rol del usuario desde localStorage
  const userRole = localStorage.getItem('userRole');
  
  if (!userRole) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

export default RoleProtectedRoute;


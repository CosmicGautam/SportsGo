// src/components/common/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.role] - single required role (legacy)
 * @param {string[]} [props.allowedRoles] - user must have one of these roles
 */
export default function ProtectedRoute({ children, role, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roles =
    allowedRoles && allowedRoles.length > 0
      ? allowedRoles
      : role
        ? [role]
        : null;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/courts" replace />;
  }

  return children;
}

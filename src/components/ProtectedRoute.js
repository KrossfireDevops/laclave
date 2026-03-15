// src/components/ProtectedRoute.js
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = ['cliente', 'proveedor', 'admin'] }) {
  const { currentUser, role, loading } = useAuth();

  if (loading) {
    // Mientras carga autenticación, no renderices nada
    return null;
  }

  if (!currentUser) {
    // ✅ Redirige a login si no hay sesión
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // ✅ Si el rol no tiene permiso, redirige a home
    return <Navigate to="/" replace />;
  }

  return children;
}
//src/components/ProtectedRoute.js
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, role, loading } = useAuth();

  if (loading) return <div style={{ padding: 20, color: 'white' }}>Cargando...</div>;
  if (!currentUser || !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
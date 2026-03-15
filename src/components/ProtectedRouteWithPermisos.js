// src/components/ProtectedRouteWithPermisos.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermisos } from '../hooks/usePermisos';

/**
 * Componente de ruta protegida con verificación de permisos
 * Uso:
 * <Route path="/admin" element={
 *   <ProtectedRouteWithPermisos requiredPermiso="roles:manage">
 *     <AdminScreen />
 *   </ProtectedRouteWithPermisos>
 * } />
 */
export default function ProtectedRouteWithPermisos({ 
  children, 
  requiredPermiso = null,
  requiredPermisos = null,
  requireAll = false,
  fallbackPath = '/'
}) {
  const { currentUser, role } = useAuth();
  const { tienePermiso, tieneAlgunPermiso, tieneTodosPermisos, loading } = usePermisos();

  // Si no hay usuario autenticado
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere rol de admin específico
  if (requiredPermiso === 'admin' && role !== 'admin') {
    return <Navigate to={fallbackPath} replace />;
  }

  // Si está cargando permisos, mostrar spinner
  if (loading && (requiredPermiso || requiredPermisos)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#0F0F1B'
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '4px solid rgba(192, 132, 252, 0.3)',
          borderTop: '4px solid #C084FC',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Verificar permiso único
  if (requiredPermiso && requiredPermiso !== 'admin') {
    if (!tienePermiso(requiredPermiso)) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Verificar múltiples permisos
  if (requiredPermisos && requiredPermisos.length > 0) {
    const tiene = requireAll 
      ? tieneTodosPermisos(requiredPermisos)
      : tieneAlgunPermiso(requiredPermisos);
    
    if (!tiene) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return children;
}
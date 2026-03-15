// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pantallas existentes
import PublicHome from './screens/PublicHome';
import ProveedorDashboard from './screens/ProveedorDashboard';
import MisCupones from './screens/MisCupones';
import MotelDetail from './screens/MotelDetail';
import AdminDashboard from './screens/AdminDashboard';
import CuponesMarketplace from './screens/CuponesMarketplace';
import Carrito from './screens/Carrito';
import AuthCallback from './screens/AuthCallback';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';

// NUEVAS PANTALLAS RBAC
import AdminRolesScreen from './screens/AdminRolesScreen'; // ✅ NUEVO

// Componentes de protección
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedRouteWithPermisos from './components/ProtectedRouteWithPermisos'; // ✅ NUEVO

// ✅ Componente de redirección inteligente
function HomeRedirect() {
  const { currentUser, role, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        padding: 20, 
        backgroundColor: '#0F0F1B', 
        color: '#E0E0FF',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
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

  if (currentUser && role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (currentUser && role === 'proveedor') {
    return <Navigate to="/proveedor" replace />;
  }

  return <PublicHome />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ======================================== */}
          {/* RUTAS PÚBLICAS */}
          {/* ======================================== */}
          
          {/* Ruta raíz */}
          <Route path="/" element={<HomeRedirect />} />
          
          {/* Detalle de motel y marketplace */}
          <Route path="/motel/:id" element={<MotelDetail />} />
          <Route path="/cupones" element={<CuponesMarketplace />} />

          {/* ======================================== */}
          {/* AUTENTICACIÓN Y RECUPERACIÓN */}
          {/* ======================================== */}
          
          {/* Callback OAuth */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Recuperación de contraseña */}
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />

          {/* Redirecciones de login/register (opcional) */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/register" element={<Navigate to="/" replace />} />

          {/* ======================================== */}
          {/* RUTAS PROTEGIDAS - CLIENTES */}
          {/* ======================================== */}
          
          <Route
            path="/mis-cupones"
            element={
              <ProtectedRoute allowedRoles={['cliente', 'proveedor', 'admin']}>
                <MisCupones />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/carrito"
            element={
              <ProtectedRoute allowedRoles={['cliente', 'proveedor', 'admin']}>
                <Carrito />
              </ProtectedRoute>
            }
          />

          {/* ======================================== */}
          {/* RUTAS PROTEGIDAS - PROVEEDORES */}
          {/* ======================================== */}
          
          <Route
            path="/proveedor/*"
            element={
              <ProtectedRoute allowedRoles={['proveedor', 'admin']}>
                <ProveedorDashboard />
              </ProtectedRoute>
            }
          />

          {/* ======================================== */}
          {/* RUTAS PROTEGIDAS - ADMINISTRADORES */}
          {/* ======================================== */}
          
          {/* Dashboard Admin (ruta base) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ADMIN - Gestión de Roles y Permisos */}
          <Route
            path="/admin/roles"
            element={
              <ProtectedRouteWithPermisos requiredPermiso="roles:manage">
                <AdminRolesScreen />
              </ProtectedRouteWithPermisos>
            }
          />

          {/* ADMIN - Gestión de Usuarios (próximamente) */}
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRouteWithPermisos requiredPermiso="usuarios:read_all">
                <AdminRolesScreen />
              </ProtectedRouteWithPermisos>
            }
          />

          {/* ADMIN - Gestión de Establecimientos (próximamente) */}
          <Route
            path="/admin/establecimientos"
            element={
              <ProtectedRouteWithPermisos requiredPermiso="establecimientos:update_all">
                <AdminDashboard />
              </ProtectedRouteWithPermisos>
            }
          />

          {/* ADMIN - Gestión de Cupones (próximamente) */}
          <Route
            path="/admin/cupones"
            element={
              <ProtectedRouteWithPermisos requiredPermiso="cupones:update_own">
                <AdminDashboard />
              </ProtectedRouteWithPermisos>
            }
          />

          {/* ADMIN - Gestión de Banners (próximamente) */}
          <Route
            path="/admin/banners"
            element={
              <ProtectedRouteWithPermisos requiredPermiso="banners:create">
                <AdminDashboard />
              </ProtectedRouteWithPermisos>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
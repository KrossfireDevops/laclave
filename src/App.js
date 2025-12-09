// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PublicHome from './screens/PublicHome';
import ProveedorDashboard from './screens/ProveedorDashboard';
import MisCupones from './screens/MisCupones';
import ProtectedRoute from './components/ProtectedRoute';
import AuthCallback from './screens/AuthCallback';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import MotelDetail from './screens/MotelDetail';
import AdminDashboard from './screens/AdminDashboard';
import CuponesMarketplace from './screens/CuponesMarketplace';
import Carrito from './screens/Carrito';

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

  // ✅ Redirección automática para Admnistradores
  if (currentUser && role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // ✅ Redirección automática para proveedores
  if (currentUser && role === 'proveedor') {
    return <Navigate to="/proveedor" replace />;
  }

  // Público o cliente
  return <PublicHome />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 🔁 Ruta raíz con redirección inteligente */}
          <Route path="/" element={<HomeRedirect />} />
          
          {/* 🔹 Rutas públicas */}
          <Route path="/motel/:id" element={<MotelDetail />} />
          <Route path="/cupones" element={<CuponesMarketplace />} />

          {/* 🆕 Rutas de recuperación */}
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />

          {/* 🔹 Callback OAuth */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* 🔹 Rutas protegidas */}
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
          <Route
            path="/proveedor/*"
            element={
              <ProtectedRoute allowedRoles={['proveedor']}>
                <ProveedorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
// src/screens/ProveedorDashboard.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { colors, globalStyles } from '../styles/globalStyles';
import TarjetaCupon from '../components/TarjetaCupon';
import { processImage } from '../utils/imageProcessor';
import GestorImagenesEstablecimiento from '../components/GestorImagenesEstablecimiento';

// ===== ICONOS =====
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" />
  </svg>
);

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

// ===== ESTILOS ESPECÍFICOS PARA PROVEEDOR =====
const proveedorStyles = {
  container: {
    backgroundColor: '#0f0f1a',
    minHeight: '100vh',
    color: '#e2e8f0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    paddingBottom: '32px'
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(15, 15, 26, 0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(192, 132, 252, 0.2)',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    margin: 0,
    maxWidth: '70vw',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
    padding: '0 20px',
    overflowX: 'auto',
    scrollbarWidth: 'none'
  },
  tabButton: {
    padding: '10px 20px',
    borderRadius: 50,
    border: 'none',
    fontSize: 14,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    flexShrink: 0
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#94a3b8'
  },
  establecimientoCard: {
    background: 'rgba(25, 25, 40, 0.8)',
    borderRadius: 16,
    padding: 20,
    margin: '0 20px 24px',
    border: '1px solid rgba(192, 132, 252, 0.2)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
  },
  establecimientoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  establecimientoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
    margin: 0
  },
  establecimientoType: {
    fontSize: 13,
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: 20,
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    color: colors.primary
  },
  userMenu: {
    position: 'relative'
  },
  userMenuDropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    background: '#1a1a2e',
    borderRadius: 16,
    padding: '12px 0',
    minWidth: 200,
    boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
    border: '1px solid rgba(192,132,252,0.3)'
  },
  signOutButton: {
    width: '100%',
    textAlign: 'left',
    padding: '12px 24px',
    background: 'none',
    border: 'none',
    color: '#EF4444',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  historialList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  historialItem: {
    background: 'rgba(30, 30, 45, 0.7)',
    padding: 16,
    borderRadius: 12,
    border: '1px solid rgba(192, 132, 252, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  historialRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 14
  },
  historialLabel: {
    color: '#94a3b8',
    fontWeight: '500'
  },
  historialValue: {
    color: '#e2e8f0',
    fontWeight: '600'
  },
  historialPrice: {
    color: '#f472b6',
    fontWeight: 'bold',
    fontSize: 16
  },
  historialCode: {
    color: '#38bdf8',
    fontWeight: 'bold',
    letterSpacing: 1,
    fontSize: 15
  },
  historialDate: {
    color: '#10B981',
    fontWeight: '600'
  },
  aceptarButton: {
    width: '100%',
    padding: '12px 20px',
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: 16
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 28,
    maxWidth: 600,
    width: '100%',
    border: '1px solid rgba(192, 132, 252, 0.4)',
    color: '#E0E0FF',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F3F4F6',
    margin: '0 0 20px',
    paddingBottom: 12,
    borderBottom: '1px solid rgba(192, 132, 252, 0.2)'
  },
  formGroup: {
    marginBottom: 16
  },
  formLabel: {
    display: 'block',
    fontSize: 14,
    fontWeight: '600',
    color: '#C4B5FD',
    marginBottom: 8
  },
  formInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid rgba(192, 132, 252, 0.3)',
    backgroundColor: 'rgba(30, 30, 40, 0.9)',
    color: 'white',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box'
  },
  modalFooter: {
    display: 'flex',
    gap: 12,
    marginTop: 24,
    paddingTop: 20,
    borderTop: '1px solid rgba(192, 132, 252, 0.2)'
  },
  modalButton: {
    flex: 1,
    padding: '12px 20px',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  imagePreview: {
    width: 100,
    height: 80,
    objectFit: 'cover',
    borderRadius: 8,
    marginRight: 8,
    border: '1px solid rgba(192, 132, 252, 0.3)'
  },
  imageUploadArea: {
    border: '2px dashed rgba(192, 132, 252, 0.4)',
    borderRadius: 12,
    padding: 24,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginBottom: 16,
    background: 'rgba(30, 30, 45, 0.5)'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 16,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 6,
    marginBottom: 6
  },
  coverImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid rgba(192, 132, 252, 0.3)'
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  editCoverButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    background: 'rgba(192, 132, 252, 0.9)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 8,
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  processingBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    background: 'rgba(16, 185, 129, 0.9)',
    color: 'white',
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 10,
    fontWeight: 'bold'
  },
  progressContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    border: '1px solid rgba(59, 130, 246, 0.5)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    transition: 'width 0.3s ease'
  }
};

// ===== COMPONENTE HISTORIAL =====
function HistorialCupones({ establecimientoId }) {
  const [cupones, setCupones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCupones = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cupones')
        .select('id, nombre_cupon, precio_cupon, codigo_redencion, redeemed_at, redeemed_by')
        .eq('establecimiento_id', establecimientoId)
        .eq('status', 'redeemed')
        .order('redeemed_at', { ascending: false });

      if (error) {
        console.error('Error al cargar historial:', error);
        setCupones([]);
      } else {
        setCupones(data ?? []);
      }
    } catch (err) {
      console.error('Error al cargar historial:', err);
      setCupones([]);
    } finally {
      setLoading(false);
    }
  }, [establecimientoId]);

  useEffect(() => {
    fetchCupones();
  }, [fetchCupones]);

  return (
    <div>
      <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 16 }}>
        Cupones canjeados: <strong>{cupones.length}</strong>
      </p>
      {loading ? (
        <p style={{ color: '#94a3b8' }}>Cargando historial...</p>
      ) : cupones.length === 0 ? (
        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No hay cupones canjeados aún.</p>
      ) : (
        <div style={proveedorStyles.historialList}>
          {cupones.map(c => (
            <div key={c.id} style={proveedorStyles.historialItem}>
              <div style={proveedorStyles.historialRow}>
                <span style={proveedorStyles.historialLabel}>Cupón:</span>
                <span style={proveedorStyles.historialValue}>{c.nombre_cupon}</span>
              </div>
              <div style={proveedorStyles.historialRow}>
                <span style={proveedorStyles.historialLabel}>Precio:</span>
                <span style={proveedorStyles.historialPrice}>
                  ${c.precio_cupon?.toLocaleString('es-MX')}
                </span>
              </div>
              <div style={proveedorStyles.historialRow}>
                <span style={proveedorStyles.historialLabel}>Código:</span>
                <span style={proveedorStyles.historialCode}>{c.codigo_redencion}</span>
              </div>
              <div style={proveedorStyles.historialRow}>
                <span style={proveedorStyles.historialLabel}>Canjeado:</span>
                <span style={proveedorStyles.historialDate}>
                  {new Date(c.redeemed_at).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== COMPONENTE SOLICITUDES =====
function SolicitudesCanje({ establecimientoId }) {
  const { currentUser } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const fetchSolicitudes = useCallback(async () => {
    setLoading(true);
    try {
      const { data: redenciones, error: redencionError } = await supabase
        .from('redenciones')
        .select('id, cupon_id, cliente_id, status, requested_at, room_number')
        .eq('status', 'pendiente')
        .order('requested_at', { ascending: false });

      if (redencionError) throw redencionError;

      if (!redenciones || redenciones.length === 0) {
        setSolicitudes([]);
        setLoading(false);
        return;
      }

      const cuponIds = redenciones.map(r => r.cupon_id);
      const { data: cupones, error: cuponError } = await supabase
        .from('cupones')
        .select(`
          id,
          nombre_cupon,
          precio_cupon,
          descuento_porcentaje,
          validity_start,
          validity_end,
          status,
          codigo_redencion,
          establecimiento_id,
          habitacion_id,
          establecimientos!establecimiento_id (nombre, municipio, cover_image),
          habitaciones!habitacion_id (nombre, capacidad)
        `)
        .in('id', cuponIds)
        .eq('establecimiento_id', establecimientoId);

      if (cuponError) throw cuponError;

      if (!cupones || cupones.length === 0) {
        setSolicitudes([]);
        setLoading(false);
        return;
      }

      const cuponMap = {};
      cupones.forEach(c => { cuponMap[c.id] = c; });

      const clienteIds = redenciones.map(r => r.cliente_id);
      
      // ✅ CORRECCIÓN: _clienteError para silenciar no-unused-vars de ESLint
      const { data: clientes, error: _clienteError } = await supabase
        .from('usuarios')
        .select('id, alias, nombre, email')
        .in('id', clienteIds);

      const clienteMap = {};
      (clientes || []).forEach(u => { clienteMap[u.id] = u; });

      const solicitudesCompletas = redenciones
        .filter(r => cuponMap[r.cupon_id])
        .map(r => ({
          ...r,
          cupones: cuponMap[r.cupon_id],
          usuarios: clienteMap[r.cliente_id]
        }));

      setSolicitudes(solicitudesCompletas);

    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  }, [establecimientoId]);

  useEffect(() => {
    fetchSolicitudes();
    // Auto-refresh cada 30 segundos para pantalla principal
    const interval = setInterval(fetchSolicitudes, 30000);
    return () => clearInterval(interval);
  }, [fetchSolicitudes]);

  const aceptarCupon = async (redencionId, cuponId) => {
    if (!window.confirm('¿Confirmar la redención de este cupón?')) return;
    
    setProcesando(true);
    try {
      const { error: redencionError } = await supabase
        .from('redenciones')
        .update({
          status: 'aprobada',
          responded_at: new Date().toISOString(),
          responded_by: currentUser.id
        })
        .eq('id', redencionId);

      if (redencionError) throw redencionError;

      const { error: cuponError } = await supabase
        .from('cupones')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
          redeemed_by: currentUser.id
        })
        .eq('id', cuponId);

      if (cuponError) throw cuponError;

      alert('✅ Cupón redimido exitosamente');
      fetchSolicitudes();

    } catch (err) {
      console.error('Error al procesar redención:', err);
      alert('❌ Error al procesar la redención: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div>
      {/* Header mejorado con badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        padding: '16px 20px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 12,
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 'bold',
            color: '#93c5fd',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            📥 Solicitudes Pendientes
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
            Cupones esperando autorización
          </p>
        </div>
        <div style={{
          background: solicitudes.length > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
          padding: '8px 16px',
          borderRadius: 20,
          border: `2px solid ${solicitudes.length > 0 ? '#10B981' : '#6B7280'}`
        }}>
          <span style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: solicitudes.length > 0 ? '#10B981' : '#9CA3AF'
          }}>
            {solicitudes.length}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{
            width: 48,
            height: 48,
            border: '4px solid rgba(192, 132, 252, 0.3)',
            borderTop: '4px solid #C084FC',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#94a3b8', margin: 0, fontSize: 15 }}>Cargando solicitudes...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : solicitudes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(30, 30, 45, 0.5)',
          borderRadius: 16,
          border: '1px dashed rgba(192, 132, 252, 0.3)'
        }}>
          <div style={{
            width: 80,
            height: 80,
            margin: '0 auto 20px',
            background: 'rgba(192, 132, 252, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40
          }}>
            ✅
          </div>
          <p style={{
            color: '#C084FC',
            fontSize: 18,
            fontWeight: 'bold',
            margin: '0 0 8px'
          }}>
            ¡Todo al día!
          </p>
          <p style={{
            color: '#94a3b8',
            fontSize: 14,
            margin: 0
          }}>
            No hay solicitudes pendientes en este momento
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
          padding: '4px'
        }}>
          {solicitudes.map(s => (
            <div key={s.id} style={{
              background: 'linear-gradient(135deg, rgba(30, 30, 45, 0.9) 0%, rgba(25, 25, 40, 0.95) 100%)',
              padding: 20,
              borderRadius: 16,
              border: '2px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 48px rgba(16, 185, 129, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.15)';
              }}
            >
              {/* Badge de "Nuevo" */}
              <div style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                fontSize: 11,
                fontWeight: 'bold',
                padding: '4px 12px',
                borderRadius: 20,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                animation: 'pulse 2s infinite'
              }}>
                🔔 NUEVO
              </div>

              <TarjetaCupon cupon={s.cupones} />

              {/* Info del cliente mejorada */}
              <div style={{
                padding: 16,
                background: 'rgba(59, 130, 246, 0.12)',
                borderRadius: 12,
                border: '1px solid rgba(59, 130, 246, 0.25)'
              }}>
                <p style={{ margin: 0, fontSize: 14, color: '#93c5fd', fontWeight: 'bold', marginBottom: 8 }}>
                  👤 Información del Cliente
                </p>
                <p style={{ margin: '4px 0', fontSize: 13, color: '#E0E0FF' }}>
                  <strong>Nombre:</strong> {s.usuarios?.alias || s.usuarios?.nombre || 'Usuario'}
                </p>
                <p style={{ margin: '4px 0', fontSize: 12, color: '#94a3b8' }}>
                  <strong>Email:</strong> {s.usuarios?.email || 'Sin email'}
                </p>
                {s.room_number && (
                  <div style={{
                    marginTop: 12,
                    padding: '8px 12px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    borderRadius: 8,
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    <p style={{ margin: 0, fontSize: 14, color: '#F59E0B', fontWeight: 'bold' }}>
                      🚪 Habitación: <span style={{ fontSize: 18 }}>{s.room_number}</span>
                    </p>
                  </div>
                )}
                {/* Timestamp */}
                <p style={{ margin: '12px 0 0', fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>
                  🕐 Solicitado: {new Date(s.requested_at).toLocaleString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Botón de acción destacado */}
              <button
                onClick={() => aceptarCupon(s.id, s.cupon_id)}
                disabled={procesando}
                style={{
                  ...proveedorStyles.aceptarButton,
                  background: procesando
                    ? '#6B7280'
                    : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  opacity: 1,
                  cursor: procesando ? 'not-allowed' : 'pointer',
                  fontSize: 17,
                  fontWeight: 'bold',
                  boxShadow: procesando
                    ? 'none'
                    : '0 4px 16px rgba(16, 185, 129, 0.4)',
                  marginTop: 0
                }}
                onMouseEnter={(e) => {
                  if (!procesando) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(16, 185, 129, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!procesando) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
                  }
                }}
              >
                {procesando ? '⏳ Procesando...' : '✅ AUTORIZAR CUPÓN'}
              </button>

              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.7; }
                }
              `}</style>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== COMPONENTE: LISTA DE HABITACIONES =====
function ListaHabitaciones({ establecimientoId, establecimientoNombre, onRefresh }) {
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [habitacionEditando, setHabitacionEditando] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [habitacionImagen, setHabitacionImagen] = useState(null);

  const fetchHabitaciones = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('habitaciones')
        .select('*')
        .eq('establecimiento_id', establecimientoId)
        .order('nombre');

      if (error) throw error;
      setHabitaciones(data || []);
    } catch (err) {
      console.error('Error al cargar habitaciones:', err);
      setHabitaciones([]);
    } finally {
      setLoading(false);
    }
  }, [establecimientoId]);

  useEffect(() => {
    fetchHabitaciones();
  }, [fetchHabitaciones]);

  const handleEditPrecio = (hab) => {
    setHabitacionEditando(hab);
    setShowEditModal(true);
  };

  const handleEditImagenes = (hab) => {
    setHabitacionImagen(hab);
    setShowImageModal(true);
  };

  const handleSavePrecio = async (updatedHab) => {
    try {
      const { error } = await supabase
        .from('habitaciones')
        .update({
          precio: parseFloat(updatedHab.precio),
          nombre: updatedHab.nombre,
          capacidad: parseInt(updatedHab.capacidad)
        })
        .eq('id', updatedHab.id);

      if (error) throw error;
      alert('✅ Precio actualizado exitosamente');
      setShowEditModal(false);
      setHabitacionEditando(null);
      fetchHabitaciones();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error al actualizar precio:', err);
      alert('❌ Error al actualizar: ' + err.message);
    }
  };

  const handleSaveImagenes = async (updatedHab) => {
    try {
      const { error } = await supabase
        .from('habitaciones')
        .update({
          imagenes: updatedHab.imagenes
        })
        .eq('id', updatedHab.id);

      if (error) throw error;
      alert('✅ Imágenes actualizadas exitosamente');
      setShowImageModal(false);
      setHabitacionImagen(null);
      fetchHabitaciones();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error al actualizar imágenes:', err);
      alert('❌ Error al actualizar imágenes: ' + err.message);
    }
  };

  return (
    <div>
      <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 16 }}>
        Habitaciones: <strong>{habitaciones.length}</strong>
      </p>
      {loading ? (
        <p style={{ color: '#94a3b8' }}>Cargando habitaciones...</p>
      ) : habitaciones.length === 0 ? (
        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No hay habitaciones registradas.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {habitaciones.map(hab => (
            <div key={hab.id} style={{
              background: 'rgba(30, 30, 45, 0.7)',
              padding: 16,
              borderRadius: 12,
              border: '1px solid rgba(192, 132, 252, 0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#F3F4F6', fontSize: 16 }}>
                  {hab.nombre}
                </p>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
                  Capacidad: {hab.capacidad} personas
                </p>
                <p style={{ fontSize: 15, color: '#C084FC', fontWeight: 'bold', margin: '8px 0 0' }}>
                  ${hab.precio?.toLocaleString('es-MX')}
                </p>
                {hab.imagenes && hab.imagenes.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {hab.imagenes.slice(0, 3).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Habitación ${idx + 1}`}
                        style={proveedorStyles.imagePreview}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100x80/333/C084FC?text=No+Image';
                        }}
                      />
                    ))}
                    {hab.imagenes.length > 3 && (
                      <span style={{ color: '#94a3b8', fontSize: 12, alignSelf: 'center' }}>
                        +{hab.imagenes.length - 3} más
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                <button
                  onClick={() => handleEditPrecio(hab)}
                  style={{
                    ...proveedorStyles.modalButton,
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#60A5FA',
                    padding: '8px 12px',
                    fontSize: 13
                  }}
                >
                  <EditIcon /> Precio
                </button>
                <button
                  onClick={() => handleEditImagenes(hab)}
                  style={{
                    ...proveedorStyles.modalButton,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34D399',
                    padding: '8px 12px',
                    fontSize: 13
                  }}
                >
                  <ImageIcon /> Imágenes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditModal && habitacionEditando && (
        <EditarPrecioModal
          habitacion={habitacionEditando}
          onClose={() => {
            setShowEditModal(false);
            setHabitacionEditando(null);
          }}
          onSave={handleSavePrecio}
        />
      )}

      {showImageModal && habitacionImagen && (
        <EditarImagenesModal
          habitacion={habitacionImagen}
          onClose={() => {
            setShowImageModal(false);
            setHabitacionImagen(null);
          }}
          onSave={handleSaveImagenes}
        />
      )}
    </div>
  );
}

// ===== MODAL: EDITAR PRECIO =====
function EditarPrecioModal({ habitacion, onClose, onSave }) {
  const [nombre, setNombre] = useState(habitacion.nombre || '');
  const [precio, setPrecio] = useState(habitacion.precio?.toString() || '');
  const [capacidad, setCapacidad] = useState(habitacion.capacidad?.toString() || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!precio || parseFloat(precio) <= 0) {
      alert('Por favor ingresa un precio válido mayor a 0');
      return;
    }
    setLoading(true);
    try {
      onSave({
        ...habitacion,
        nombre: nombre.trim(),
        precio: parseFloat(precio),
        capacidad: parseInt(capacidad) || 2
      });
    } catch (err) {
      console.error('Error:', err);
      alert('Error al guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={proveedorStyles.modalOverlay} onClick={onClose}>
      <div style={proveedorStyles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={proveedorStyles.modalTitle}>✏️ Editar Habitación</h2>
        <form onSubmit={handleSubmit}>
          <div style={proveedorStyles.formGroup}>
            <label style={proveedorStyles.formLabel}>Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={proveedorStyles.formInput}
              required
              placeholder="ej. Suite con Jacuzzi"
            />
          </div>
          <div style={proveedorStyles.formGroup}>
            <label style={proveedorStyles.formLabel}>Precio ($ MXN) *</label>
            <input
              type="number"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              style={proveedorStyles.formInput}
              required
              min="1"
              step="1"
              placeholder="ej. 500"
            />
          </div>
          <div style={proveedorStyles.formGroup}>
            <label style={proveedorStyles.formLabel}>Capacidad (personas)</label>
            <input
              type="number"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              style={proveedorStyles.formInput}
              min="1"
              max="10"
              placeholder="ej. 2"
            />
          </div>
          <div style={proveedorStyles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...proveedorStyles.modalButton,
                backgroundColor: 'rgba(156, 163, 175, 0.2)',
                color: '#9CA3AF'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...proveedorStyles.modalButton,
                backgroundColor: loading ? '#6B7280' : '#3B82F6',
                color: 'white'
              }}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== MODAL: EDITAR IMÁGENES DE HABITACIÓN =====
function EditarImagenesModal({ habitacion, onClose, onSave }) {
  const [imagenes, setImagenes] = useState(habitacion.imagenes || []);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [errorMessages, setErrorMessages] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    console.log('📁 Archivos seleccionados:', selectedFiles.length);
    selectedFiles.forEach((f, i) => {
      console.log(`  ${i+1}. ${f.name} (${f.type}, ${(f.size/1024).toFixed(2)}KB)`);
    });

    if (selectedFiles.some(f => !f.type.match('image.*'))) {
      alert('Solo se permiten imágenes (JPG, PNG, WEBP, GIF)');
      return;
    }

    if (selectedFiles.length + imagenes.length > 10) {
      alert('Máximo 10 imágenes por habitación');
      return;
    }

    setFiles(selectedFiles);
    setErrorMessages([]);
  };

  const uploadImages = async () => {
    if (files.length === 0) return imagenes;

    setUploading(true);
    setProcessing(true);
    setProcessedCount(0);
    setCurrentFileIndex(0);
    setErrorMessages([]);

    const uploadedUrls = [...imagenes];
    const errors = [];

    try {
      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i);
        setProcessedCount(i);

        const file = files[i];

        if (file.size > 10 * 1024 * 1024) {
          errors.push(`"${file.name}" es demasiado grande (máx. 10MB)`);
          continue;
        }

        try {
          console.log(`📸 Procesando: ${file.name} (${(file.size/1024).toFixed(0)}KB)`);

          // Verificar que processImage existe
          if (typeof processImage !== 'function') {
            throw new Error('processImage no está disponible. Verifica que imageProcessor.js esté importado correctamente.');
          }

          // Timeout de 10 segundos para procesamiento
          const processedBlob = await Promise.race([
            processImage(file, {
              width: 400,
              height: 510,
              quality: 0.85,
              maintainRatio: true,
              maxSizeMB: 1
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout: Procesamiento tardó demasiado')), 10000)
            )
          ]);

          if (!processedBlob) {
            throw new Error('processImage retornó un valor nulo o indefinido');
          }

          console.log(`✅ Procesada: ${(processedBlob.size/1024).toFixed(0)}KB`);

          const fileName = `${habitacion.id}_${Date.now()}_${i}.jpg`;
          const filePath = `habitaciones/${fileName}`;

          const uploadResult = await Promise.race([
            supabase.storage
              .from('rooms')
              .upload(filePath, processedBlob, {
                upsert: false,
                contentType: 'image/jpeg'
              }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout: Subida tardó demasiado')), 15000)
            )
          ]);

          if (uploadResult.error) {
            throw uploadResult.error;
          }

          const { data: { publicUrl }, error: urlError } = supabase.storage
            .from('rooms')
            .getPublicUrl(filePath);

          if (urlError) {
            throw urlError;
          }

          if (publicUrl) {
            uploadedUrls.push(publicUrl);
            console.log('✅ Imagen subida:', publicUrl);
          }

        } catch (processError) {
          console.error(`Error procesando "${file.name}":`, processError);
          const errorMessage = processError?.message || processError?.toString() || 'Error desconocido';
          errors.push(`⚠️ "${file.name}": ${errorMessage}`);
        }
      }

      if (errors.length > 0) {
        setErrorMessages(errors);
      }

      // Si se subieron imágenes nuevas, actualizar en la base de datos
      if (uploadedUrls.length > imagenes.length) {
        try {
          const { error: dbError } = await supabase
            .from('habitaciones')
            .update({
              imagenes: uploadedUrls
            })
            .eq('id', habitacion.id);

          if (dbError) throw dbError;
          // Actualizar estado local
          setImagenes(uploadedUrls);
          console.log('✅ Imágenes guardadas en base de datos');
        } catch (dbErr) {
          console.error('Error al guardar en BD:', dbErr);
          setErrorMessages([...errors, `❌ Error al guardar: ${dbErr.message}`]);
        }
      }

      return uploadedUrls;

    } catch (err) {
      console.error('Error en uploadImages:', err);
      setErrorMessages([...errorMessages, `❌ Error inesperado: ${err.message}`]);
      return imagenes;
    } finally {
      setUploading(false);
      setProcessing(false);
      setFiles([]);
      setProcessedCount(0);
      setCurrentFileIndex(0);
    }
  };

  const handleSave = async () => {
    // Si está procesando, no hacer nada
    if (uploading || processing) {
      return;
    }

    // Si no hay archivos nuevos seleccionados
    if (files.length === 0) {
      alert('⚠️ No hay imágenes nuevas para subir. Selecciona archivos primero.');
      return;
    }

    // Subir las nuevas imágenes
    const newImages = await uploadImages();

    // Limpiar el input de archivos
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Si se subieron correctamente, cerrar el modal
    if (newImages.length > imagenes.length) {
      alert(`✅ ${newImages.length - imagenes.length} imagen(es) agregada(s) exitosamente`);
      onClose();
    }
  };

  const removeImage = async (index) => {
    if (!window.confirm('¿Eliminar esta imagen permanentemente?')) return;

    const newImages = imagenes.filter((_, i) => i !== index);

    try {
      // Actualizar directamente en la base de datos
      const { error } = await supabase
        .from('habitaciones')
        .update({
          imagenes: newImages
        })
        .eq('id', habitacion.id);

      if (error) throw error;

      // Actualizar estado local
      setImagenes(newImages);
      alert('✅ Imagen eliminada exitosamente');

      // Notificar al componente padre para refrescar
      if (onSave) {
        onSave({
          ...habitacion,
          imagenes: newImages
        });
      }

    } catch (err) {
      console.error('Error al eliminar imagen:', err);
      alert('❌ Error al eliminar: ' + err.message);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={proveedorStyles.modalOverlay} onClick={onClose}>
      <div style={proveedorStyles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={proveedorStyles.modalTitle}>
          🖼️ Imágenes de "{habitacion.nombre || 'Habitación'}"
        </h2>

        {/* Nota informativa */}
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16
        }}>
          <p style={{ margin: 0, color: '#60A5FA', fontSize: 13, lineHeight: 1.5 }}>
            💡 <strong>Cómo funciona:</strong><br/>
            • Para <strong>eliminar</strong>: Haz clic en la ✕ roja (se elimina inmediatamente)<br/>
            • Para <strong>agregar</strong>: Selecciona archivos y haz clic en "Subir Nueva(s) Imagen(es)"
          </p>
        </div>

        {processing && files.length > 0 && (
          <div style={proveedorStyles.progressContainer}>
            <p style={{ color: '#93c5fd', fontSize: 14, margin: '0 0 8px', fontWeight: 'bold' }}>
              🔄 Procesando imágenes ({processedCount + 1}/{files.length})...
            </p>
            <div style={proveedorStyles.progressBar}>
              <div
                style={{
                  ...proveedorStyles.progressFill,
                  width: `${((processedCount + 1) / files.length) * 100}%`
                }}
              />
            </div>
            <p style={{ color: '#60a5fa', fontSize: 12, margin: '8px 0 0', fontStyle: 'italic' }}>
              Optimizando calidad y tamaño (400x510px)
            </p>
            <p style={{ color: '#F59E0B', fontSize: 11, margin: '4px 0 0', fontStyle: 'italic' }}>
              Imagen actual: {files[currentFileIndex]?.name || '...'}
            </p>
          </div>
        )}

        {errorMessages.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            maxHeight: 200,
            overflowY: 'auto'
          }}>
            <p style={{ margin: 0, color: '#EF4444', fontWeight: 'bold', marginBottom: 8 }}>
              ⚠️ Errores durante la subida:
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#F87171', fontSize: 12 }}>
              {errorMessages.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={proveedorStyles.formGroup}>
          <label style={proveedorStyles.formLabel}>
            Imágenes actuales ({imagenes.length}/10)
          </label>
          {imagenes.length === 0 ? (
            <div style={{
              padding: 24,
              background: 'rgba(30, 30, 45, 0.5)',
              borderRadius: 12,
              textAlign: 'center',
              border: '1px dashed rgba(192, 132, 252, 0.3)'
            }}>
              <ImageIcon />
              <p style={{ color: '#94a3b8', marginTop: 12, fontStyle: 'italic' }}>
                No hay imágenes para esta habitación
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: 12,
              maxHeight: 400,
              overflowY: 'auto',
              paddingRight: 8
            }}>
              {imagenes.map((img, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <img
                    src={img}
                    alt={`Habitación ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: 100,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid rgba(192, 132, 252, 0.3)',
                      cursor: 'pointer'
                    }}
                    onClick={() => window.open(img, '_blank')}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100x100/333/C084FC?text=No+Image';
                    }}
                  />
                  <span style={proveedorStyles.processingBadge}>
                    ✓ 400x510
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(idx);
                    }}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.95)',
                      border: '2px solid #1a1a2e',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}
                    title="Eliminar imagen"
                  >
                    ✕
                  </button>
                  <div style={{
                    position: 'absolute',
                    bottom: 4,
                    left: 4,
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 10
                  }}>
                    #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={proveedorStyles.formGroup}>
          <label style={proveedorStyles.formLabel}>Agregar nuevas imágenes</label>
          {/* Input oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {/* Área clickeable */}
          <div
            style={{
              ...proveedorStyles.imageUploadArea,
              borderColor: files.length > 0 ? '#10B981' : 'rgba(192, 132, 252, 0.4)',
              background: files.length > 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 30, 45, 0.5)'
            }}
            onClick={triggerFileInput}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              pointerEvents: 'none'
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(192, 132, 252, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ImageIcon />
              </div>
              <p style={{
                color: files.length > 0 ? '#34D399' : '#94a3b8',
                marginTop: 4,
                fontSize: 14,
                fontWeight: files.length > 0 ? 'bold' : 'normal'
              }}>
                {files.length > 0
                  ? `✅ ${files.length} imagen(es) seleccionada(s)`
                  : 'Haz clic o arrastra imágenes aquí'}
              </p>
              <p style={{
                color: '#94a3b8',
                fontSize: 12,
                marginTop: 4
              }}>
                JPG/PNG/WEBP/GIF • Máx. 10MB • Optimizadas a 400x510px
              </p>
            </div>
          </div>
        </div>

        <div style={proveedorStyles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading || processing}
            style={{
              ...proveedorStyles.modalButton,
              backgroundColor: uploading || processing ? '#6B7280' : 'rgba(156, 163, 175, 0.2)',
              color: uploading || processing ? '#9CA3AF' : '#9CA3AF'
            }}
          >
            {uploading || processing ? 'Procesando...' : 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={uploading || processing || files.length === 0}
            style={{
              ...proveedorStyles.modalButton,
              backgroundColor: (uploading || processing || files.length === 0) ? '#6B7280' : '#10B981',
              color: 'white',
              opacity: (uploading || processing || files.length === 0) ? 0.6 : 1,
              cursor: (uploading || processing || files.length === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading || processing ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  display: 'inline-block',
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                {processing ? 'Procesando...' : uploading ? 'Subiendo...' : 'Guardando...'}
              </span>
            ) : files.length > 0 ? (
              `✅ Subir ${files.length} Nueva(s) Imagen(es)`
            ) : (
              '⚠️ Selecciona Imágenes Primero'
            )}
          </button>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

// ===== MODAL: EDITAR PORTADA DE ESTABLECIMIENTO =====
function EditarPortadaModal({ establecimiento, onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(establecimiento.cover_image || null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.type.match('image.*')) {
      alert('Solo se permiten imágenes (JPG, PNG, WEBP, GIF)');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('La imagen excede el límite de 10MB');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleSave = async () => {
    if (!file) {
      alert('Por favor selecciona una imagen para subir');
      return;
    }

    setUploading(true);
    setProcessing(true);

    try {
      console.log(`Procesando portada: ${file.name}`);

      const processedBlob = await processImage(file, {
        width: 1920,
        height: 600,
        quality: 0.88,
        maintainRatio: true,
        maxSizeMB: 2
      });

      console.log(`✅ Portada procesada: ${(processedBlob.size/1024).toFixed(0)}KB`);

      const fileName = `${establecimiento.id}_cover_${Date.now()}.jpg`;
      const filePath = `portadas/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('establecimientos')
        .upload(filePath, processedBlob, {
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('Error al subir portada:', uploadError);
        alert(`❌ Error al subir imagen: ${uploadError.message}`);
        setUploading(false);
        setProcessing(false);
        return;
      }

      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('establecimientos')
        .getPublicUrl(filePath);

      if (urlError) {
        console.error('Error al obtener URL de portada:', urlError);
        alert(`⚠️ Imagen subida pero sin URL pública`);
        setUploading(false);
        setProcessing(false);
        return;
      }

      if (!publicUrl) {
        alert('❌ No se pudo obtener la URL de la imagen');
        setUploading(false);
        setProcessing(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('establecimientos')
        .update({
          cover_image: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', establecimiento.id);

      if (updateError) {
        console.error('Error al actualizar portada:', updateError);
        alert(`❌ Error al actualizar: ${updateError.message}`);
        setUploading(false);
        setProcessing(false);
        return;
      }

      alert('✅ Portada actualizada exitosamente');
      onSave({ ...establecimiento, cover_image: publicUrl });
      onClose();

    } catch (err) {
      console.error('Error procesando portada:', err);
      alert('Error inesperado al procesar portada: ' + err.message);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={proveedorStyles.modalOverlay} onClick={onClose}>
      <div style={proveedorStyles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={proveedorStyles.modalTitle}>
          🏠 Portada de "{establecimiento.nombre}"
        </h2>

        {processing && (
          <div style={proveedorStyles.progressContainer}>
            <p style={{ color: '#93c5fd', fontSize: 14, margin: '0 0 8px' }}>
              🔄 Procesando portada...
            </p>
            <div style={proveedorStyles.progressBar}>
              <div style={{ ...proveedorStyles.progressFill, width: '100%' }} />
            </div>
            <p style={{ color: '#60a5fa', fontSize: 12, margin: '8px 0 0', fontStyle: 'italic' }}>
              Optimizando a 1920x600px con calidad premium
            </p>
          </div>
        )}

        <div style={proveedorStyles.formGroup}>
          <label style={proveedorStyles.formLabel}>Portada actual</label>
          {previewUrl ? (
            <div style={proveedorStyles.coverImageContainer}>
              <img
                src={previewUrl}
                alt="Portada actual"
                style={proveedorStyles.coverImage}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x200/333/C084FC?text=Portada+No+Disponible';
                }}
              />
              {establecimiento.cover_image && (
                <span style={{
                  ...proveedorStyles.processingBadge,
                  top: 12,
                  left: 12,
                  background: 'rgba(16, 185, 129, 0.9)'
                }}>
                  ✓ 1920x600
                </span>
              )}
            </div>
          ) : (
            <div style={{
              padding: 40,
              background: 'rgba(30, 30, 45, 0.5)',
              borderRadius: 12,
              textAlign: 'center',
              border: '1px dashed rgba(192, 132, 252, 0.3)'
            }}>
              <HomeIcon />
              <p style={{ color: '#94a3b8', marginTop: 12, fontStyle: 'italic' }}>
                No hay portada actual
              </p>
            </div>
          )}
        </div>

        <div style={proveedorStyles.formGroup}>
          <label style={proveedorStyles.formLabel}>Seleccionar nueva portada</label>
          <div
            style={{
              ...proveedorStyles.imageUploadArea,
              borderColor: file ? '#10B981' : 'rgba(192, 132, 252, 0.4)',
              background: file ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 30, 45, 0.5)',
              padding: 32
            }}
            onClick={triggerFileInput}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{
                width: '100%',
                height: '100%',
                opacity: 0,
                position: 'absolute',
                cursor: 'pointer'
              }}
            />
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(192, 132, 252, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HomeIcon />
              </div>
              <p style={{
                color: file ? '#34D399' : '#94a3b8',
                fontSize: 15,
                fontWeight: file ? 'bold' : 'normal'
              }}>
                {file
                  ? `✅ ${file.name}`
                  : 'Haz clic o arrastra una imagen aquí'}
              </p>
              <p style={{
                color: '#94a3b8',
                fontSize: 12
              }}>
                JPG/PNG/WEBP/GIF • Máx. 10MB • Recomendado: 1920x600px
              </p>
            </div>
          </div>
        </div>

        <div style={proveedorStyles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...proveedorStyles.modalButton,
              backgroundColor: 'rgba(156, 163, 175, 0.2)',
              color: '#9CA3AF'
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={uploading || processing || !file}
            style={{
              ...proveedorStyles.modalButton,
              backgroundColor: uploading || processing || !file ? '#6B7280' : '#C084FC',
              color: 'white'
            }}
          >
            {uploading || processing ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  display: 'inline-block',
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                {processing ? 'Procesando...' : 'Subiendo...'}
              </span>
            ) : (
              'Actualizar Portada'
            )}
          </button>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

// ===== HOOK PERSONALIZADO =====
function useMisEstablecimientos() {
  const { currentUser } = useAuth();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = React.useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);

    try {
      const { data: asignaciones, error: asignError } = await supabase
        .from('usuario_establecimientos')
        .select('establecimiento_id')
        .eq('usuario_id', currentUser.id);

      if (asignError) throw asignError;

      if (!asignaciones || asignaciones.length === 0) {
        setLista([]);
        setLoading(false);
        return;
      }

      const establecimientoIds = asignaciones.map(a => a.establecimiento_id);

      const { data, error } = await supabase
        .from('establecimientos')
        .select('id, nombre, tipo, status, cover_image, municipio')
        .in('id', establecimientoIds)
        .eq('status', 'activo')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLista(data ?? []);

    } catch (err) {
      console.error('❌ Error al cargar establecimientos:', err);
      setLista([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { lista, loading, refetch: fetch };
}

// ===== COMPONENTE PRINCIPAL =====
export default function ProveedorDashboard() {
  const navigate = useNavigate();
  const { currentUser, role, signOut } = useAuth();
  const { lista: establecimientos, loading, refetch: refetchEstablecimientos } = useMisEstablecimientos();
  const [activeTab, setActiveTab] = useState('solicitudes');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const [showPortadaModal, setShowPortadaModal] = useState(false);
  const [establecimientoPortada, setEstablecimientoPortada] = useState(null);
  const [showImagenesModal, setShowImagenesModal] = useState(false);
  const [establecimientoImagenes, setEstablecimientoImagenes] = useState(null);

  useEffect(() => {
    if (role !== 'proveedor' && role !== 'admin') {
      navigate('/');
      return;
    }
  }, [role, navigate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  const handleRefresh = () => {
    refetchEstablecimientos();
  };

  const handleSavePortada = (updatedEst) => {
    refetchEstablecimientos();
  };

  const handleSaveImagenes = (updatedEst) => {
    refetchEstablecimientos();
  };

  const openPortadaModal = (establecimiento) => {
    setEstablecimientoPortada(establecimiento);
    setShowPortadaModal(true);
  };

  const openImagenesModal = (establecimiento) => {
    setEstablecimientoImagenes(establecimiento);
    setShowImagenesModal(true);
  };

  if (loading) {
    return (
      <div style={proveedorStyles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
          <div style={globalStyles.spinner} />
          <p style={{ color: '#94a3b8' }}>Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={proveedorStyles.container}>
      <header style={proveedorStyles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={proveedorStyles.headerTitle}>
            {establecimientos.length === 1
              ? `PANEL ${establecimientos[0].nombre}`
              : 'Panel del Proveedor'}
          </h1>
        </div>

        <div ref={profileMenuRef} style={proveedorStyles.userMenu}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(192,132,252,0.15)',
              padding: '8px 16px',
              borderRadius: 20,
              border: `1px solid ${colors.border}`,
              color: colors.primary,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            <UserIcon />
            <span>{currentUser?.alias || 'Proveedor'}</span>
          </button>

          {profileMenuOpen && (
            <div style={proveedorStyles.userMenuDropdown}>
              <button onClick={handleSignOut} style={proveedorStyles.signOutButton}>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <div style={{ paddingTop: 24 }}>
        <div style={proveedorStyles.tabs}>
          <button
            onClick={() => setActiveTab('solicitudes')}
            style={{
              ...proveedorStyles.tabButton,
              backgroundColor: activeTab === 'solicitudes' ? colors.primary : 'rgba(192,132,252,0.15)',
              color: activeTab === 'solicitudes' ? 'white' : colors.primary
            }}
          >
            📥 Solicitudes
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            style={{
              ...proveedorStyles.tabButton,
              backgroundColor: activeTab === 'historial' ? colors.primary : 'rgba(192,132,252,0.15)',
              color: activeTab === 'historial' ? 'white' : colors.primary
            }}
          >
            📜 Historial
          </button>
          <button
            onClick={() => setActiveTab('habitaciones')}
            style={{
              ...proveedorStyles.tabButton,
              backgroundColor: activeTab === 'habitaciones' ? colors.primary : 'rgba(192,132,252,0.15)',
              color: activeTab === 'habitaciones' ? 'white' : colors.primary
            }}
          >
            🏨 Habitaciones
          </button>
        </div>

        {establecimientos.length === 0 ? (
          <div style={proveedorStyles.emptyState}>
            <p style={{ fontSize: 18 }}>No tienes establecimientos asignados.</p>
            <p style={{ fontSize: 14, marginTop: 8, color: '#94a3b8' }}>
              Contacta al administrador para asignarte uno.
            </p>
          </div>
        ) : (
          establecimientos.map(est => (
            <div key={est.id} style={proveedorStyles.establecimientoCard}>
              <div style={proveedorStyles.establecimientoHeader}>
                <h2 style={proveedorStyles.establecimientoTitle}>
                  {est.nombre}
                </h2>
                <span style={proveedorStyles.establecimientoType}>
                  {est.tipo === 'motel' ? 'Motel' : est.tipo === 'bar' ? 'Bar' : est.tipo === 'nightclub' ? 'Night Club' : 'Table Dance'}
                </span>
              </div>

              {/* Contenido según tab activo */}
              {activeTab === 'historial' && (
                <HistorialCupones establecimientoId={est.id} />
              )}

              {activeTab === 'solicitudes' && (
                <SolicitudesCanje establecimientoId={est.id} />
              )}

              {activeTab === 'habitaciones' && (
                <>
                  {/* Portada con botón de edición - SOLO en tab Habitaciones */}
                  {est.cover_image && (
                    <div style={proveedorStyles.coverImageContainer}>
                      <img
                        src={est.cover_image}
                        alt={est.nombre}
                        style={proveedorStyles.coverImage}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/600x200/333/C084FC?text=Portada+No+Disponible';
                        }}
                      />
                      <button
                        onClick={() => openPortadaModal(est)}
                        style={proveedorStyles.editCoverButton}
                      >
                        <EditIcon /> Editar Portada
                      </button>
                    </div>
                  )}

                  {/* Botón para gestionar imágenes del establecimiento - SOLO en tab Habitaciones */}
                  <div style={{ marginBottom: 20 }}>
                    <button
                      onClick={() => openImagenesModal(est)}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#34D399',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: 12,
                        fontSize: 15,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.25)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <ImageIcon /> Gestionar Imágenes del Establecimiento
                    </button>
                  </div>

                  <ListaHabitaciones
                    establecimientoId={est.id}
                    establecimientoNombre={est.nombre}
                    onRefresh={handleRefresh}
                  />
                </>
              )}
            </div>
          ))
        )}
      </div>

      {showPortadaModal && establecimientoPortada && (
        <EditarPortadaModal
          establecimiento={establecimientoPortada}
          onClose={() => {
            setShowPortadaModal(false);
            setEstablecimientoPortada(null);
          }}
          onSave={handleSavePortada}
        />
      )}

      {showImagenesModal && establecimientoImagenes && (
        <GestorImagenesEstablecimiento
          establecimiento={establecimientoImagenes}
          onClose={() => {
            setShowImagenesModal(false);
            setEstablecimientoImagenes(null);
          }}
          onSave={handleSaveImagenes}
        />
      )}
    </div>
  );
}
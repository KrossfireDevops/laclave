// src/screens/ProveedorDashboard.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { colors, globalStyles } from '../styles/globalStyles';
import TarjetaCupon from '../components/TarjetaCupon';

// ===== ICONOS =====
const BackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
);
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
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
    gap: 12,
    marginBottom: 24,
    padding: '0 20px'
  },
  tabButton: {
    padding: '10px 20px',
    borderRadius: 50,
    border: 'none',
    fontSize: 15,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
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
  solicitudCard: {
    background: 'rgba(30, 30, 45, 0.7)',
    padding: 16,
    borderRadius: 12,
    border: '1px solid rgba(16, 185, 129, 0.3)'
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
  }
};

// ===== COMPONENTE HISTORIAL =====
function HistorialCupones({ establecimientoId }) {
  const [cupones, setCupones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCupones();
  }, [establecimientoId]);

  const fetchCupones = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cupones')
        .select('id, nombre_cupon, precio_cupon, codigo_redencion, redeemed_at')
        .eq('establecimiento_id', establecimientoId)
        .eq('status', 'redeemed')
        .order('redeemed_at', { ascending: false });

      if (error) {
        console.error('Error al cargar historial:', error);
        setCupones([]);
      } else {
        console.log('✅ Historial cargado:', data);
        setCupones(data ?? []);
      }
    } catch (err) {
      console.error('Error al cargar historial:', err);
      setCupones([]);
    } finally {
      setLoading(false);
    }
  };

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

// ===== COMPONENTE SOLICITUDES (CORREGIDO) =====
function SolicitudesCanje({ establecimientoId }) {
  const { currentUser } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    fetchSolicitudes();
  }, [establecimientoId]);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      console.log('🔍 Buscando solicitudes para establecimiento:', establecimientoId);

      // Paso 1: Obtener SOLO redenciones con status 'pendiente'
      const { data: redenciones, error: redencionError } = await supabase
        .from('redenciones')
        .select('id, cupon_id, cliente_id, status, requested_at, room_number')
        .eq('status', 'pendiente') // ← FILTRO CLAVE: solo pendientes
        .order('requested_at', { ascending: false });

      if (redencionError) {
        console.error('❌ Error al cargar redenciones:', redencionError);
        throw redencionError;
      }

      console.log('📋 Redenciones PENDIENTES encontradas:', redenciones?.length || 0);

      // Si no hay redenciones pendientes, terminar aquí
      if (!redenciones || redenciones.length === 0) {
        console.log('ℹ️ No hay solicitudes pendientes');
        setSolicitudes([]);
        setLoading(false);
        return;
      }

      // Paso 2: Obtener IDs de cupones
      const cuponIds = redenciones.map(r => r.cupon_id);
      console.log('🎫 IDs de cupones a buscar:', cuponIds);

      // Paso 3: Obtener cupones con sus relaciones
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

      if (cuponError) {
        console.error('❌ Error al cargar cupones:', cuponError);
        throw cuponError;
      }

      console.log('🎫 Cupones del establecimiento encontrados:', cupones?.length || 0);

      if (!cupones || cupones.length === 0) {
        console.log('ℹ️ No hay cupones válidos para este establecimiento');
        setSolicitudes([]);
        setLoading(false);
        return;
      }

      // Paso 4: Crear mapa de cupones
      const cuponMap = {};
      cupones.forEach(c => { cuponMap[c.id] = c; });

      // Paso 5: Obtener datos de clientes
      const clienteIds = redenciones.map(r => r.cliente_id);
      const { data: clientes, error: clienteError } = await supabase
        .from('usuarios')
        .select('id, alias, nombre, email')
        .in('id', clienteIds);

      if (clienteError) {
        console.error('⚠️ Error al cargar clientes:', clienteError);
      }

      console.log('👥 Clientes encontrados:', clientes?.length || 0);

      // Paso 6: Crear mapa de clientes
      const clienteMap = {};
      (clientes || []).forEach(u => { clienteMap[u.id] = u; });

      // Paso 7: Combinar datos - SOLO redenciones pendientes con cupones válidos
      const solicitudesCompletas = redenciones
        .filter(r => cuponMap[r.cupon_id]) // Solo si el cupón existe y pertenece al establecimiento
        .map(r => ({
          ...r,
          cupones: cuponMap[r.cupon_id],
          usuarios: clienteMap[r.cliente_id]
        }));

      console.log('✅ Solicitudes PENDIENTES completas:', solicitudesCompletas.length);
      
      // Verificar que todas sean pendientes
      solicitudesCompletas.forEach(s => {
        if (s.status !== 'pendiente') {
          console.warn('⚠️ Solicitud con status incorrecto:', s);
        }
      });

      setSolicitudes(solicitudesCompletas);

    } catch (err) {
      console.error('💥 Error general al cargar solicitudes:', err);
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  };

  const aceptarCupon = async (redencionId, cuponId) => {
    if (!window.confirm('¿Confirmar la redención de este cupón?')) return;
    
    setProcesando(true);
    try {
      console.log('🔄 Iniciando proceso de redención');
      console.log('📝 Datos:', { 
        redencionId, 
        cuponId, 
        userId: currentUser.id,
        timestamp: new Date().toISOString()
      });

      // PASO 1: Verificar que la redención existe antes de actualizar
      const { data: redencionActual, error: checkError } = await supabase
        .from('redenciones')
        .select('*')
        .eq('id', redencionId)
        .single();

      if (checkError) {
        console.error('❌ Error al verificar redención:', checkError);
        throw new Error('No se pudo verificar la redención: ' + checkError.message);
      }

      console.log('📋 Redención actual:', redencionActual);

      // PASO 2: Actualizar el estado de la redención a 'aprobada'
      const updateData = {
        status: 'aprobada',
        responded_at: new Date().toISOString(),
        responded_by: currentUser.id
      };

      console.log('📝 Intentando actualizar redención con:', updateData);

      const { data: redencionData, error: redencionError } = await supabase
        .from('redenciones')
        .update(updateData)
        .eq('id', redencionId)
        .select();

      if (redencionError) {
        console.error('❌ Error completo al actualizar redención:', {
          error: redencionError,
          message: redencionError.message,
          details: redencionError.details,
          hint: redencionError.hint,
          code: redencionError.code
        });
        throw new Error(`Error al actualizar redención: ${redencionError.message} (Código: ${redencionError.code})`);
      }

      if (!redencionData || redencionData.length === 0) {
        console.error('⚠️ No se devolvieron datos después de actualizar la redención');
        console.log('Verificando si se actualizó...');
        
        // Verificar manualmente
        const { data: verificacion } = await supabase
          .from('redenciones')
          .select('*')
          .eq('id', redencionId)
          .single();
        
        console.log('🔍 Estado después de la actualización:', verificacion);
      } else {
        console.log('✅ Redención actualizada exitosamente:', redencionData);
      }

      // PASO 3: Actualizar el estado del cupón a 'redeemed'
      console.log('📝 Actualizando cupón...');
      
      const { data: cuponData, error: cuponError } = await supabase
        .from('cupones')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
          redeemed_by: currentUser.id
        })
        .eq('id', cuponId)
        .select();

      if (cuponError) {
        console.error('❌ Error al actualizar cupón:', cuponError);
        throw new Error('Error al actualizar cupón: ' + cuponError.message);
      }

      console.log('✅ Cupón actualizado:', cuponData);

      // PASO 4: Mostrar mensaje de éxito
      alert('✅ Cupón redimido exitosamente\n\nEl cupón ha sido canjeado y ya no aparecerá en solicitudes pendientes.');
      
      // PASO 5: Recargar la lista de solicitudes
      console.log('🔄 Recargando lista de solicitudes...');
      await fetchSolicitudes();
      console.log('✅ Lista actualizada');

    } catch (err) {
      console.error('💥 Error completo al procesar la redención:', err);
      alert('❌ Error al procesar la redención\n\nDetalles: ' + err.message + '\n\nRevisa la consola para más información.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div>
      <p style={{
        color: '#94a3b8',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
        margin: '0 0 20px',
        padding: '0 10px'
      }}>
        Solicitudes pendientes: <strong>{solicitudes.length}</strong>
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '4px solid rgba(192, 132, 252, 0.3)',
            borderTop: '4px solid #C084FC',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px'
          }} />
          <p style={{ color: '#94a3b8', margin: 0 }}>Cargando solicitudes...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : solicitudes.length === 0 ? (
        <p style={{
          color: '#94a3b8',
          fontStyle: 'italic',
          textAlign: 'center',
          margin: '20px 0',
          padding: '0 10px'
        }}>
          No hay solicitudes pendientes.
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          maxHeight: 'calc(220px * 3 + 16px * 2)',
          overflowY: 'auto',
          padding: '0 10px',
          paddingRight: 6
        }}>
          {solicitudes.map(s => (
            <div key={s.id} style={{
              background: 'rgba(30, 30, 45, 0.7)',
              padding: 16,
              borderRadius: 12,
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <TarjetaCupon cupon={s.cupones} />
              
              <div style={{
                padding: 12,
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: 8,
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <p style={{ margin: 0, fontSize: 13, color: '#93c5fd', fontWeight: '600' }}>
                  👤 Cliente: {s.usuarios?.alias || s.usuarios?.nombre || 'Usuario'}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                  📧 {s.usuarios?.email || 'Sin email'}
                </p>
                {s.room_number && (
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: '#F59E0B', fontWeight: '700' }}>
                    🚪 Habitación: <strong>{s.room_number}</strong>
                  </p>
                )}
              </div>

              <button
                onClick={() => aceptarCupon(s.id, s.cupon_id)}
                disabled={procesando}
                style={{
                  ...proveedorStyles.aceptarButton,
                  opacity: procesando ? 0.6 : 1,
                  cursor: procesando ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!procesando) {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10B981';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {procesando ? '⏳ Procesando...' : '✅ Aceptar Cupón'}
              </button>
            </div>
          ))}
        </div>
      )}
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
      const { data, error } = await supabase
        .from('establecimientos')
        .select('id, nombre, tipo, status, cover_image, municipio')
        .eq('owner_id', currentUser.id)
        .eq('status', 'activo')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log('🏨 Establecimientos del proveedor:', data);
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
  const { lista: establecimientos, loading } = useMisEstablecimientos();
  const [activeTab, setActiveTab] = useState('solicitudes');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (role !== 'proveedor') {
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
      {/* HEADER */}
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

      {/* CONTENIDO */}
      <div style={{ paddingTop: 24 }}>
        {/* TABS */}
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
        </div>

        {/* ESTABLECIMIENTOS */}
        {establecimientos.length === 0 ? (
          <div style={proveedorStyles.emptyState}>
            <p style={{ fontSize: 18 }}>No tienes establecimientos registrados.</p>
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
                  {est.tipo === 'motel' ? 'Motel' : est.tipo === 'bar' ? 'Bar' : 'Night Club'}
                </span>
              </div>
              {activeTab === 'historial' ? (
                <HistorialCupones establecimientoId={est.id} />
              ) : (
                <SolicitudesCanje establecimientoId={est.id} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
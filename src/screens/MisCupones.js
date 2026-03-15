// src/screens/MisCupones.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function MisCupones() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cupones, setCupones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('activos');

  const fetchCupones = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cupones')
        .select(`
          id,
          nombre_cupon,
          precio_cupon,
          validity_start,
          validity_end,
          status,
          redeemed_at,
          codigo_redencion,
          establecimiento_id,
          habitacion_id
        `)
        .eq('comprado_por', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const cuponesConDetalles = await Promise.all(
        (data || []).map(async (cupon) => {
          let establecimiento = null;
          let habitacion = null;

          if (cupon.establecimiento_id) {
            const { data: est } = await supabase
              .from('establecimientos')
              .select('id, nombre, cover_image, municipio')
              .eq('id', cupon.establecimiento_id)
              .single();
            establecimiento = est;
          }

          if (cupon.habitacion_id) {
            const { data: hab } = await supabase
              .from('habitaciones')
              .select('id, nombre, capacidad, precio')
              .eq('id', cupon.habitacion_id)
              .single();
            habitacion = hab;
          }

          return {
            ...cupon,
            establecimientos: establecimiento,
            habitaciones: habitacion
          };
        })
      );

      setCupones(cuponesConDetalles);
    } catch (err) {
      console.error('Error al cargar cupones:', err);
      alert('💎 No pudimos cargar tus cupones en este momento. Por favor, verifica tu conexión o inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]); // ✅ Ahora incluye currentUser completo

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchCupones();
  }, [currentUser, navigate, fetchCupones]);

  const handleSolicitarRedencion = async (cupon) => {
    if (!currentUser) return;

    if (cupon.redeemed_at) {
      alert('🎟️ Este cupón ya fue canjeado. ¡Gracias por confiar en LaClave!');
      return;
    }

    if (!window.confirm(`¿Solicitar canje del cupón "${cupon.nombre_cupon}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('solicitudes_redencion')
        .insert({
          cupon_id: cupon.id,
          cliente_id: currentUser.id,
          estado: 'pendiente'
        });

      if (error) throw error;

      alert('📬 Solicitud de canje enviada. El establecimiento la revisará pronto.');
      fetchCupones();
    } catch (err) {
      console.error('Error al solicitar redención:', err);
      alert('🛠️ No pudimos enviar tu solicitud de canje. Por favor, inténtalo de nuevo.');
    }
  };

  const cuponesAMostrar = () => {
    if (filter === 'canjeados') {
      return cupones.filter(c => c.redeemed_at);
    }
    return cupones.filter(c => c.status === 'sold' && !c.redeemed_at);
  };

  const getStatusInfo = (cupon) => {
    if (cupon.redeemed_at) {
      return {
        label: 'Canjeado',
        color: '#9CA3AF',
        bg: 'rgba(156, 163, 175, 0.2)'
      };
    }
    
    const hoy = new Date();
    const validez = new Date(cupon.validity_end);
    if (validez < hoy) {
      return {
        label: 'Expirado',
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.2)'
      };
    }
    
    return {
      label: 'Activo',
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.2)'
    };
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#0F0F1B',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#E0E0FF'
      }}>
        <div style={{
          width: 48,
          height: 48,
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

  return (
    <div style={{
      backgroundColor: '#0F0F1B',
      minHeight: '100vh',
      padding: '20px',
      color: '#E0E0FF'
    }}>
      {/* HEADER */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24 
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(192, 132, 252, 0.15)',
            border: '2px solid rgba(192, 132, 252, 0.3)',
            color: '#C084FC',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            outline: 'none',
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(192, 132, 252, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.6)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(192, 132, 252, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.3)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 style={{ 
          color: '#C084FC', 
          fontSize: 28, 
          margin: 0,
          textAlign: 'center',
          flex: 1
        }}>
          Mis Cupones
        </h1>

        <div style={{ width: 44 }} />
      </div>

      {/* FILTROS */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 20,
        justifyContent: 'center'
      }}>
        {[
          { id: 'activos', label: `Activos (${cupones.filter(c => c.status === 'sold' && !c.redeemed_at).length})` },
          { id: 'canjeados', label: `Canjeados (${cupones.filter(c => c.redeemed_at).length})` }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === f.id ? '#C084FC' : 'rgba(192, 132, 252, 0.2)',
              color: filter === f.id ? 'white' : '#C084FC',
              border: '1px solid #C084FC',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      {cuponesAMostrar().length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: 18, color: '#9CA3AF', marginBottom: 16 }}>
            {filter === 'activos' && 'No tienes cupones activos.'}
            {filter === 'canjeados' && 'Aún no has canjeado cupones.'}
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#EC4899',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Explorar Cupones
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20
        }}>
          {cuponesAMostrar().map(cupon => {
            const statusInfo = getStatusInfo(cupon);
            const estaActivo = cupon.status === 'sold' && !cupon.redeemed_at;
            
            return (
              <div key={cupon.id} style={{
                backgroundColor: 'rgba(30, 30, 40, 0.7)',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid rgba(192, 132, 252, 0.2)',
                transition: 'transform 0.2s, border-color 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.2)';
              }}
              >
                {cupon.establecimientos?.cover_image && (
                  <div style={{ height: 150, overflow: 'hidden', backgroundColor: '#1F2937' }}>
                    <img
                      src={cupon.establecimientos.cover_image}
                      alt={cupon.establecimientos.nombre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/320x150/333/C084FC?text=Motel';
                      }}
                    />
                  </div>
                )}

                <div style={{ padding: 16 }}>
                  <div style={{
                    display: 'inline-block',
                    backgroundColor: statusInfo.bg,
                    color: statusInfo.color,
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 'bold',
                    marginBottom: 12
                  }}>
                    {statusInfo.label}
                  </div>

                  <h3 style={{ color: '#E0E0FF', margin: '0 0 8px', fontSize: 18, fontWeight: 'bold' }}>
                    {cupon.nombre_cupon}
                  </h3>
                  
                  {cupon.establecimientos && (
                    <p style={{ color: '#A78BFA', margin: '0 0 6px', fontSize: 14 }}>
                      🏨 {cupon.establecimientos.nombre}
                    </p>
                  )}

                  {cupon.establecimientos?.municipio && (
                    <p style={{ color: '#9CA3AF', margin: '0 0 12px', fontSize: 12 }}>
                      📍 {cupon.establecimientos.municipio}
                    </p>
                  )}
                  
                  {cupon.habitaciones && (
                    <div style={{ backgroundColor: 'rgba(192, 132, 252, 0.1)', padding: 8, borderRadius: 6, marginBottom: 12 }}>
                      <p style={{ color: '#E0E0FF', margin: '0 0 4px', fontSize: 14 }}>
                        🛏️ {cupon.habitaciones.nombre}
                      </p>
                      <p style={{ color: '#9CA3AF', margin: 0, fontSize: 12 }}>
                        Capacidad: {cupon.habitaciones.capacidad || '—'} personas
                      </p>
                    </div>
                  )}
                  
                  <p style={{ color: '#C084FC', fontWeight: 'bold', fontSize: 22, margin: '12px 0' }}>
                    ${cupon.precio_cupon?.toLocaleString('es-MX') || '—'}
                  </p>

                  {cupon.codigo_redencion && (
                    <div style={{
                      backgroundColor: 'rgba(251, 191, 36, 0.1)',
                      border: '1px dashed #FCD34D',
                      padding: 8,
                      borderRadius: 6,
                      marginBottom: 12
                    }}>
                      <p style={{ color: '#FCD34D', fontSize: 12, margin: '0 0 4px', fontWeight: 'bold' }}>
                        Código de Redención:
                      </p>
                      <p style={{ color: '#FDE68A', fontSize: 16, margin: 0, fontWeight: 'bold', letterSpacing: 2 }}>
                        {cupon.codigo_redencion}
                      </p>
                    </div>
                  )}
                  
                  <p style={{ color: '#9CA3AF', fontSize: 12, margin: '8px 0' }}>
                    Válido: {new Date(cupon.validity_start).toLocaleDateString('es-MX')} - {new Date(cupon.validity_end).toLocaleDateString('es-MX')}
                  </p>

                  {cupon.redeemed_at && (
                    <p style={{ color: '#9CA3AF', fontSize: 12, margin: '4px 0' }}>
                      Canjeado: {new Date(cupon.redeemed_at).toLocaleDateString('es-MX')}
                    </p>
                  )}

                  {estaActivo && (
                    <button
                      onClick={() => handleSolicitarRedencion(cupon)}
                      style={{
                        width: '100%',
                        backgroundColor: '#10B981',
                        color: 'white',
                        border: 'none',
                        padding: '12px',
                        borderRadius: 8,
                        fontSize: 15,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        marginTop: 12,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#059669';
                        e.target.style.transform = 'scale(1.02)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#10B981';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      🎟️ Solicitar Canje
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
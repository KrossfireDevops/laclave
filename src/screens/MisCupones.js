// src/screens/MisCupones.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const DIAS_ALERTA_VENCIMIENTO = 7;

export default function MisCupones() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cupones, setCupones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('activos');
  const [nuevoCupon, setNuevoCupon] = useState(null);
  const [cuponesDisponibles, setCuponesDisponibles] = useState(0);
  const notifTimeoutRef = useRef(null);

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

          return { ...cupon, establecimientos: establecimiento, habitaciones: habitacion };
        })
      );

      setCupones(cuponesConDetalles);

      // Obtener conteo de cupones disponibles en marketplace para estado vacío motivador
      try {
        const today = new Date().toISOString().split('T')[0];
        const { count } = await supabase
          .from('cupones')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'onSale')
          .gte('validity_end', today);
        setCuponesDisponibles(count || 0);
      } catch (_) {}

    } catch (err) {
      console.error('Error al cargar cupones:', err);
      alert('No pudimos cargar tus cupones. Por favor, inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    fetchCupones();
  }, [currentUser, navigate, fetchCupones]);

  // Realtime: escucha cuando un cupón pasa a 'sold'
  useEffect(() => {
    if (!currentUser?.id) return;

    const canal = supabase
      .channel('cupones-pagados-' + currentUser.id)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'cupones',
          filter: 'comprado_por=eq.' + currentUser.id,
        },
        async (payload) => {
          if (payload.new?.status !== 'sold') return;
          setNuevoCupon(payload.new?.nombre_cupon || 'Tu cupón');
          if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
          notifTimeoutRef.current = setTimeout(() => setNuevoCupon(null), 5000);
          setFilter('activos');
          await fetchCupones();
        }
      )
      .subscribe();

    return () => {
      if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
      supabase.removeChannel(canal);
    };
  }, [currentUser?.id, fetchCupones]);

  const handleSolicitarRedencion = async (cupon) => {
    if (!currentUser) return;
    if (cupon.redeemed_at) { alert('Este cupón ya fue canjeado.'); return; }
    if (!window.confirm(`¿Solicitar canje del cupón "${cupon.nombre_cupon}"?`)) return;

    try {
      const { error } = await supabase
        .from('solicitudes_redencion')
        .insert({ cupon_id: cupon.id, cliente_id: currentUser.id, estado: 'pendiente' });
      if (error) throw error;
      alert('Solicitud de canje enviada. El establecimiento la revisará pronto.');
      fetchCupones();
    } catch (err) {
      console.error('Error al solicitar redención:', err);
      alert('No pudimos enviar tu solicitud. Por favor, inténtalo de nuevo.');
    }
  };

  // ====================== HELPERS DE ESTADO ======================

  const hoy = new Date();

  const estaVigente = (cupon) => new Date(cupon.validity_end) >= hoy;

  const venceProximo = (cupon) => {
    const diff = new Date(cupon.validity_end) - hoy;
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return dias >= 0 && dias <= DIAS_ALERTA_VENCIMIENTO;
  };

  const diasRestantes = (cupon) => {
    const diff = new Date(cupon.validity_end) - hoy;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Clasificación de cupones
  const cuponesActivos    = cupones.filter(c => c.status === 'sold' && !c.redeemed_at && estaVigente(c));
  const cuponesCanjeados  = cupones.filter(c => c.redeemed_at);
  const cuponesExpirados  = cupones.filter(c => c.status === 'sold' && !c.redeemed_at && !estaVigente(c));

  const cuponesAMostrar = () => {
    if (filter === 'canjeados') return cuponesCanjeados;
    if (filter === 'expirados') return cuponesExpirados;
    return cuponesActivos;
  };

  const getStatusInfo = (cupon) => {
    if (cupon.redeemed_at)    return { label: 'Canjeado', color: '#9CA3AF', bg: 'rgba(156,163,175,0.2)' };
    if (!estaVigente(cupon))  return { label: 'Expirado', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' };
    if (venceProximo(cupon))  return { label: 'Activo', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' };
    return { label: 'Activo', color: '#10B981', bg: 'rgba(16,185,129,0.2)' };
  };

  // ====================== RENDER ======================

  if (loading) {
    return (
      <div style={{ backgroundColor: '#0F0F1B', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 48, height: 48, border: '4px solid rgba(192,132,252,0.3)', borderTop: '4px solid #C084FC', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0F0F1B', minHeight: '100vh', padding: '20px', color: '#E0E0FF' }}>

      {/* Notificación de pago confirmado */}
      {nuevoCupon && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: 'linear-gradient(135deg, #10B981, #059669)',
          color: 'white', padding: '14px 24px', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
          fontSize: 15, fontWeight: 'bold', textAlign: 'center',
          animation: 'slideDown 0.4s ease-out', maxWidth: '90vw',
        }}>
          🎉 ¡Pago confirmado! "{nuevoCupon}" ya está activo
          <style>{`
            @keyframes slideDown {
              from { opacity:0; transform:translateX(-50%) translateY(-20px); }
              to   { opacity:1; transform:translateX(-50%) translateY(0); }
            }
          `}</style>
        </div>
      )}

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => navigate(-1)}
          style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(192,132,252,0.15)', border: '2px solid rgba(192,132,252,0.3)', color: '#C084FC', cursor: 'pointer', outline: 'none', padding: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,132,252,0.3)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(192,132,252,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 style={{ color: '#C084FC', fontSize: 28, margin: 0, textAlign: 'center', flex: 1 }}>
          Mis Cupones
        </h1>

        {/* Indicador Realtime */}
        <div style={{ width: 44, display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Actualización automática activa">
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981', animation: 'pulso 2s infinite' }} />
          <style>{`@keyframes pulso { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>

        {/* Tab Activos */}
        <button onClick={() => setFilter('activos')}
          style={{
            padding: '9px 20px',
            backgroundColor: filter === 'activos' ? '#C084FC' : 'rgba(192,132,252,0.15)',
            color: filter === 'activos' ? 'white' : '#C084FC',
            border: '1px solid rgba(192,132,252,0.5)',
            borderRadius: 20, fontSize: 14, fontWeight: 'bold',
            cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
          Activos
          {cuponesActivos.length > 0 && (
            <span style={{
              backgroundColor: filter === 'activos' ? 'rgba(255,255,255,0.3)' : 'rgba(192,132,252,0.3)',
              borderRadius: 10, padding: '1px 8px', fontSize: 12,
            }}>
              {cuponesActivos.length}
            </span>
          )}
        </button>

        {/* Tab Canjeados */}
        <button onClick={() => setFilter('canjeados')}
          style={{
            padding: '9px 20px',
            backgroundColor: filter === 'canjeados' ? '#C084FC' : 'rgba(192,132,252,0.15)',
            color: filter === 'canjeados' ? 'white' : '#C084FC',
            border: '1px solid rgba(192,132,252,0.5)',
            borderRadius: 20, fontSize: 14, fontWeight: 'bold',
            cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
          Canjeados
          {cuponesCanjeados.length > 0 && (
            <span style={{
              backgroundColor: filter === 'canjeados' ? 'rgba(255,255,255,0.3)' : 'rgba(192,132,252,0.3)',
              borderRadius: 10, padding: '1px 8px', fontSize: 12,
            }}>
              {cuponesCanjeados.length}
            </span>
          )}
        </button>

        {/* Tab Expirados — discreto, sin contador */}
        {cuponesExpirados.length > 0 && (
          <button onClick={() => setFilter('expirados')}
            style={{
              padding: '7px 16px',
              backgroundColor: filter === 'expirados' ? 'rgba(107,114,128,0.3)' : 'transparent',
              color: filter === 'expirados' ? '#9CA3AF' : '#4B5563',
              border: '1px solid rgba(107,114,128,0.25)',
              borderRadius: 20, fontSize: 13, fontWeight: 'normal',
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
            Expirados
          </button>
        )}
      </div>

      {/* CONTENIDO */}
      {cuponesAMostrar().length === 0 ? (

        // Estado vacío motivador
        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
          {filter === 'activos' && (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎟️</div>
              <p style={{ fontSize: 20, color: '#E0E0FF', fontWeight: 'bold', marginBottom: 8 }}>
                Aún no tienes cupones activos
              </p>
              {cuponesDisponibles > 0 ? (
                <>
                  <p style={{ fontSize: 15, color: '#9CA3AF', marginBottom: 28, lineHeight: 1.6 }}>
                    Hay <span style={{ color: '#C084FC', fontWeight: 'bold' }}>{cuponesDisponibles} ofertas</span> esperándote hoy en LaClave
                  </p>
                  <button onClick={() => navigate('/cupones')}
                    style={{ background: 'linear-gradient(135deg, #C084FC, #A855F7)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: 14, fontSize: 16, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 24px rgba(192,132,252,0.4)' }}>
                    Ver ofertas disponibles
                  </button>
                </>
              ) : (
                <p style={{ fontSize: 15, color: '#9CA3AF', marginBottom: 28 }}>
                  Explora el marketplace para encontrar tu próximo descuento
                </p>
              )}
            </>
          )}
          {filter === 'canjeados' && (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✨</div>
              <p style={{ fontSize: 20, color: '#E0E0FF', fontWeight: 'bold', marginBottom: 8 }}>
                Aún no has canjeado cupones
              </p>
              <p style={{ fontSize: 15, color: '#9CA3AF' }}>
                Aquí aparecerá tu historial de visitas
              </p>
            </>
          )}
          {filter === 'expirados' && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📭</div>
              <p style={{ fontSize: 16, color: '#6B7280' }}>Sin cupones expirados</p>
            </>
          )}
        </div>

      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {cuponesAMostrar().map(cupon => {
            const statusInfo  = getStatusInfo(cupon);
            const estaActivo  = cupon.status === 'sold' && !cupon.redeemed_at && estaVigente(cupon);
            const vencePronto = estaActivo && venceProximo(cupon);
            const esExpirado  = filter === 'expirados';
            const dias        = diasRestantes(cupon);

            return (
              <div key={cupon.id}
                style={{
                  backgroundColor: 'rgba(30,30,40,0.7)',
                  borderRadius: 12, overflow: 'hidden',
                  border: vencePronto
                    ? '1px solid rgba(245,158,11,0.5)'
                    : esExpirado
                      ? '1px solid rgba(107,114,128,0.15)'
                      : '1px solid rgba(192,132,252,0.2)',
                  transition: 'transform 0.2s, border-color 0.2s',
                  opacity: esExpirado ? 0.55 : 1,
                  filter: esExpirado ? 'grayscale(40%)' : 'none',
                }}
                onMouseOver={e => { if (!esExpirado) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = vencePronto ? 'rgba(245,158,11,0.8)' : 'rgba(192,132,252,0.5)'; } }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = vencePronto ? 'rgba(245,158,11,0.5)' : esExpirado ? 'rgba(107,114,128,0.15)' : 'rgba(192,132,252,0.2)'; }}
              >
                {/* Imagen */}
                {cupon.establecimientos?.cover_image && (
                  <div style={{ height: 150, overflow: 'hidden', backgroundColor: '#1F2937', position: 'relative' }}>
                    <img src={cupon.establecimientos.cover_image} alt={cupon.establecimientos.nombre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.src = 'https://via.placeholder.com/320x150/333/C084FC?text=Motel'; }} />

                    {/* Badge vence pronto sobre la imagen */}
                    {vencePronto && (
                      <div style={{
                        position: 'absolute', top: 10, right: 10,
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        color: 'white', padding: '5px 12px',
                        borderRadius: 20, fontSize: 12, fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(245,158,11,0.5)',
                        animation: 'pulsoAmbar 2s infinite',
                      }}>
                        ⚡ Vence en {dias === 0 ? 'hoy' : dias === 1 ? '1 día' : dias + ' días'}
                      </div>
                    )}

                    {/* Badge expirado sobre la imagen */}
                    {esExpirado && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ color: '#9CA3AF', fontSize: 13, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', background: 'rgba(0,0,0,0.6)', padding: '6px 14px', borderRadius: 8 }}>
                          No aprovechado
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ padding: 16 }}>
                  {/* Status badge */}
                  <div style={{ display: 'inline-block', backgroundColor: statusInfo.bg, color: statusInfo.color, padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 'bold', marginBottom: 12 }}>
                    {statusInfo.label}
                  </div>

                  <h3 style={{ color: esExpirado ? '#6B7280' : '#E0E0FF', margin: '0 0 8px', fontSize: 18, fontWeight: 'bold' }}>
                    {cupon.nombre_cupon}
                  </h3>

                  {cupon.establecimientos && (
                    <p style={{ color: esExpirado ? '#4B5563' : '#A78BFA', margin: '0 0 6px', fontSize: 14 }}>
                      🏨 {cupon.establecimientos.nombre}
                    </p>
                  )}

                  {cupon.establecimientos?.municipio && (
                    <p style={{ color: '#6B7280', margin: '0 0 12px', fontSize: 12 }}>
                      📍 {cupon.establecimientos.municipio}
                    </p>
                  )}

                  {cupon.habitaciones && (
                    <div style={{ backgroundColor: esExpirado ? 'rgba(107,114,128,0.1)' : 'rgba(192,132,252,0.1)', padding: 8, borderRadius: 6, marginBottom: 12 }}>
                      <p style={{ color: esExpirado ? '#6B7280' : '#E0E0FF', margin: '0 0 4px', fontSize: 14 }}>🛏️ {cupon.habitaciones.nombre}</p>
                      <p style={{ color: '#6B7280', margin: 0, fontSize: 12 }}>Capacidad: {cupon.habitaciones.capacidad || '—'} personas</p>
                    </div>
                  )}

                  <p style={{ color: esExpirado ? '#4B5563' : '#C084FC', fontWeight: 'bold', fontSize: 22, margin: '12px 0' }}>
                    ${cupon.precio_cupon?.toLocaleString('es-MX') || '—'}
                  </p>

                  {/* Código de redención */}
                  {cupon.codigo_redencion && !esExpirado && (
                    <div style={{ backgroundColor: 'rgba(251,191,36,0.1)', border: '1px dashed #FCD34D', padding: '12px 16px', borderRadius: 10, marginBottom: 12 }}>
                      <p style={{ color: '#FCD34D', fontSize: 11, margin: '0 0 4px', fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' }}>
                        Código de Redención
                      </p>
                      <p style={{ color: '#FDE68A', fontSize: 20, margin: 0, fontWeight: 'bold', letterSpacing: 4, fontFamily: 'monospace' }}>
                        {cupon.codigo_redencion}
                      </p>
                      <p style={{ color: '#9CA3AF', fontSize: 11, margin: '6px 0 0' }}>
                        Muestra este código en el establecimiento
                      </p>
                    </div>
                  )}

                  {/* Fechas de validez */}
                  <p style={{ color: '#6B7280', fontSize: 12, margin: '8px 0' }}>
                    Válido: {new Date(cupon.validity_start).toLocaleDateString('es-MX')} — {new Date(cupon.validity_end).toLocaleDateString('es-MX')}
                  </p>

                  {cupon.redeemed_at && (
                    <p style={{ color: '#9CA3AF', fontSize: 12, margin: '4px 0' }}>
                      Canjeado: {new Date(cupon.redeemed_at).toLocaleDateString('es-MX')}
                    </p>
                  )}

                  {/* Alerta urgente de vencimiento próximo */}
                  {vencePronto && !cupon.redeemed_at && (
                    <div style={{
                      backgroundColor: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: 8, padding: '8px 12px', marginTop: 8, marginBottom: 4,
                    }}>
                      <p style={{ color: '#F59E0B', fontSize: 12, margin: 0, fontWeight: 'bold' }}>
                        ⚡ {dias === 0 ? '¡Tu cupón vence hoy!' : dias === 1 ? '¡Tu cupón vence mañana!' : `Tu cupón vence en ${dias} días — ¡úsalo pronto!`}
                      </p>
                    </div>
                  )}

                  {/* Botón canje */}
                  {estaActivo && (
                    <button onClick={() => handleSolicitarRedencion(cupon)}
                      style={{
                        width: '100%',
                        background: vencePronto
                          ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                          : '#10B981',
                        color: 'white', border: 'none', padding: '12px',
                        borderRadius: 8, fontSize: 15, fontWeight: 'bold',
                        cursor: 'pointer', marginTop: 12, transition: 'all 0.2s',
                      }}
                      onMouseOver={e => { e.target.style.opacity = '0.9'; e.target.style.transform = 'scale(1.02)'; }}
                      onMouseOut={e => { e.target.style.opacity = '1'; e.target.style.transform = 'scale(1)'; }}>
                      🎟️ Solicitar Canje
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulso { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes pulsoAmbar {
          0%,100% { box-shadow: 0 2px 8px rgba(245,158,11,0.5); }
          50%      { box-shadow: 0 2px 16px rgba(245,158,11,0.9); }
        }
      `}</style>
    </div>
  );
}
// src/screens/CuponesMarketplace.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import VisitorPopup from '../components/VisitorPopup';
import RegisterModal from '../components/RegisterModal';

export default function CuponesMarketplace() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cupones, setCupones] = useState([]);
  const [recomendados, setRecomendados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [conteoPorHabitacion, setConteoPorHabitacion] = useState({});

  // ✅ IDs de cupones siendo agregados (para deshabilitar botón mientras procesa)
  const [agregando, setAgregando] = useState(new Set());
  // ✅ IDs de cupones ya agregados al carrito en esta sesión (para mostrar estado visual)
  const [agregados, setAgregados] = useState(new Set());

  const [showVisitorPopup, setShowVisitorPopup] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // ICONOS SVG
  const BackIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
    </svg>
  );

  const CartIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="2"></circle><circle cx="20" cy="21" r="2"></circle>
      <path d="M5.5 2H21l-2.5 12H7L5.5 2z"></path>
    </svg>
  );

  const LocationIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );

  const fetchRecomendaciones = useCallback(async (cuponesDisponibles) => {
    if (!currentUser) {
      setRecomendados(cuponesDisponibles.slice(0, 3));
      return;
    }
    try {
      const { data: historial, error } = await supabase
        .from('cupones')
        .select('establecimiento_id')
        .eq('comprado_por', currentUser.id)
        .eq('status', 'redeemed');

      if (error) throw error;

      const motelesVisitados = [...new Set(historial.map(c => c.establecimiento_id).filter(Boolean))];
      if (motelesVisitados.length > 0) {
        const recom = cuponesDisponibles
          .filter(c => motelesVisitados.includes(c.establecimiento_id))
          .slice(0, 3);
        setRecomendados(recom.length > 0 ? recom : cuponesDisponibles.slice(0, 3));
      } else {
        setRecomendados(cuponesDisponibles.slice(0, 3));
      }
    } catch (err) {
      console.error('Error al cargar recomendaciones:', err);
      setRecomendados(cuponesDisponibles.slice(0, 3));
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchCupones = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('cupones')
          .select(`
            *,
            establecimientos (
              id, nombre, municipio, rating, cover_image
            )
          `)
          .eq('status', 'onSale')
          .is('redeemed_at', null)
          .gte('validity_end', today);

        if (error) throw error;

        const conteo = {};
        data.forEach(c => {
          conteo[c.habitacion_id] = (conteo[c.habitacion_id] || 0) + 1;
        });
        setConteoPorHabitacion(conteo);

        const habitacionesVistas = new Set();
        const cuponesUnicos = data.filter(c => {
          if (habitacionesVistas.has(c.habitacion_id)) return false;
          habitacionesVistas.add(c.habitacion_id);
          return true;
        });

        setCupones(cuponesUnicos);
        fetchRecomendaciones(cuponesUnicos);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCupones();
  }, [currentUser, fetchRecomendaciones]);

  // ✅ Cargar cupones que el usuario ya tiene en carrito al montar
  useEffect(() => {
    const fetchCarritoActual = async () => {
      if (!currentUser?.id) return;
      try {
        const { data, error } = await supabase
          .from('carritos')
          .select('cupon_id')
          .eq('usuario_id', currentUser.id)
          .eq('status', 'active');

        if (error) throw error;
        if (data?.length > 0) {
          setAgregados(new Set(data.map(item => item.cupon_id)));
        }
      } catch (err) {
        console.error('Error al cargar carrito actual:', err);
      }
    };
    fetchCarritoActual();
  }, [currentUser]);

  // ✅ Función con reserva inmediata del cupón
  const agregarAlCarrito = async (cuponId) => {
    if (!currentUser) {
      setShowVisitorPopup(true);
      return;
    }

    // Evitar doble click
    if (agregando.has(cuponId) || agregados.has(cuponId)) return;

    setAgregando(prev => new Set(prev).add(cuponId));

    try {
      const today = new Date().toISOString().split('T')[0];

      // Verificar disponibilidad
      const { data: cupon, error: cuponError } = await supabase
        .from('cupones')
        .select('id, status')
        .eq('id', cuponId)
        .eq('status', 'onSale')
        .is('redeemed_at', null)
        .gte('validity_end', today)
        .maybeSingle();

      if (cuponError) {
        console.error('Error en validación de cupón:', cuponError);
        alert('🛠️ Hubo un problema al verificar la disponibilidad. Por favor, inténtalo de nuevo.');
        return;
      }

      if (!cupon) {
        alert('🎟️ Lo sentimos, este cupón ya fue canjeado o ya no está vigente.');
        // Remover del grid localmente
        setCupones(prev => prev.filter(c => c.id !== cuponId));
        setRecomendados(prev => prev.filter(c => c.id !== cuponId));
        return;
      }

      // ✅ 1. Reservar el cupón inmediatamente (status: reserved)
      const { data: reservaData, error: reservaError } = await supabase
        .from('cupones')
        .update({ status: 'reserved' })
        .eq('id', cuponId)
        .eq('status', 'onSale')
        .select();

      console.log('DATA:', JSON.stringify(reservaData));
      console.log('ERROR:', JSON.stringify(reservaError));
      console.log('FILAS AFECTADAS:', reservaData?.length);

      if (reservaError) {
        console.error('Error al reservar cupón:', reservaError);
        alert('🎟️ Este cupón acaba de ser tomado por otro usuario. ¡Intenta con otro!');
        setCupones(prev => prev.filter(c => c.id !== cuponId));
        setRecomendados(prev => prev.filter(c => c.id !== cuponId));
        return;
      }

      // ✅ 2. Agregar al carrito
      const { error: carritoError } = await supabase
        .from('carritos')
        .insert({
          usuario_id: currentUser.id,
          cupon_id: cuponId,
          status: 'active',
          created_at: new Date().toISOString()
        });

      if (carritoError) {
        // Si falla el carrito, revertir la reserva
        await supabase
          .from('cupones')
          .update({ status: 'onSale' })
          .eq('id', cuponId);
        console.error('Error al agregar al carrito:', carritoError);
        throw carritoError;
      }

      // ✅ 3. Marcar como agregado y ocultar del grid
      setAgregados(prev => new Set(prev).add(cuponId));

      // Ocultar cupón del marketplace (reservado para este usuario)
      setCupones(prev => prev.filter(c => c.id !== cuponId));
      setRecomendados(prev => prev.filter(c => c.id !== cuponId));

      
      // Actualizar conteo por habitacion
      const cuponData = cupones.find(c => c.id === cuponId);
      if (cuponData?.habitacion_id) {
        setConteoPorHabitacion(prev => ({
          ...prev,
          [cuponData.habitacion_id]: Math.max(0, (prev[cuponData.habitacion_id] || 1) - 1)
        }));
      }

    } catch (err) {
      console.error('Error en agregarAlCarrito:', err);
      alert('💎 No pudimos agregar el cupón. Por favor, intenta de nuevo.');
    } finally {
      setAgregando(prev => {
        const next = new Set(prev);
        next.delete(cuponId);
        return next;
      });
    }
  };

  const handleComprarCupones = () => {
    if (!currentUser) {
      setShowVisitorPopup(true);
      return;
    }
    navigate('/carrito');
  };

  const calcularPrecioFinal = (cupon) => {
    if (!cupon.descuento_porcentaje) return cupon.precio_cupon;
    return cupon.precio_cupon * (1 - cupon.descuento_porcentaje / 100);
  };

  const cuponesFiltrados = () => {
    let lista = [...cupones];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      lista = lista.filter(c =>
        c.establecimientos?.nombre?.toLowerCase().includes(term) ||
        c.establecimientos?.municipio?.toLowerCase().includes(term) ||
        c.nombre_cupon?.toLowerCase().includes(term)
      );
    }
    if (filtro === 'mejores-descuentos')
      return lista.sort((a, b) => (b.descuento_porcentaje || 0) - (a.descuento_porcentaje || 0));
    if (filtro === 'precio-bajo')
      return lista.sort((a, b) => calcularPrecioFinal(a) - calcularPrecioFinal(b));
    return lista;
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 60, height: 60, border: '6px solid #1a1a1a', borderTop: '6px solid #C084FC', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#e2e8f0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      <VisitorPopup
        isOpen={showVisitorPopup}
        onClose={() => setShowVisitorPopup(false)}
        onRegister={() => {
          setShowVisitorPopup(false);
          setShowRegisterModal(true);
        }}
      />

      {showRegisterModal && (
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
        />
      )}

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
        <button onClick={() => navigate(-1)}
          style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(192,132,252,0.15)', border: '2px solid rgba(192,132,252,0.3)', color: '#C084FC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,132,252,0.3)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(192,132,252,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}>
          <BackIcon />
        </button>
        <h1 style={{ color: '#C084FC', fontSize: 28, fontWeight: 'bold', margin: 0 }}>Cupones Disponibles</h1>
        <button
          onClick={handleComprarCupones}
          style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(236,72,153,0.15)', border: '2px solid rgba(236,72,153,0.3)', color: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(236,72,153,0.3)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(236,72,153,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}>
          <CartIcon />
          {/* ✅ Badge con cantidad en carrito */}
          {agregados.size > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              background: '#EC4899', color: 'white',
              borderRadius: '50%', width: 20, height: 20,
              fontSize: 11, fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {agregados.size}
            </span>
          )}
        </button>
      </div>

      {/* SECCIÓN RECOMENDADOS */}
      {recomendados.length > 0 && (
        <div style={{ padding: '0 24px 24px' }}>
          <h2 style={{ color: '#DDD6FE', fontSize: 19, margin: '0 0 16px' }}>🎯 Para ti</h2>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12 }}>
            {recomendados.map((cupon) => {
              const cantidad = conteoPorHabitacion[cupon.habitacion_id] || 0;
              if (cantidad === 0) return null;
              const estaAgregando = agregando.has(cupon.id);
              const estaAgregado = agregados.has(cupon.id);
              return (
                <div key={`rec-${cupon.id}`} style={{
                  minWidth: 220,
                  background: 'rgba(30,30,40,0.95)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: estaAgregado ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(192,132,252,0.2)',
                  flexShrink: 0,
                  transition: 'all 0.3s'
                }}>
                  {cupon.establecimientos?.cover_image && (
                    <img src={cupon.establecimientos.cover_image} alt={cupon.establecimientos.nombre}
                      style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: 12 }}>
                    <h3 style={{ fontSize: 14, margin: '0 0 6px', color: 'white' }}>{cupon.nombre_cupon}</h3>
                    <p style={{ fontSize: 12, color: '#A78BFA', margin: '0 0 8px' }}>{cupon.establecimientos?.municipio}</p>
                    <p style={{ fontSize: 16, color: '#C084FC', fontWeight: 'bold', margin: 0 }}>
                      ${Math.round(calcularPrecioFinal(cupon)).toLocaleString('es-MX')}
                    </p>
                    <button
                      onClick={() => agregarAlCarrito(cupon.id)}
                      disabled={estaAgregando || estaAgregado}
                      style={{
                        width: '100%',
                        background: estaAgregado ? '#10B981' : estaAgregando ? '#6B7280' : '#C084FC',
                        color: 'white', border: 'none', padding: '6px',
                        borderRadius: 8, fontSize: 12, fontWeight: 'bold',
                        marginTop: 8, cursor: estaAgregado || estaAgregando ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s'
                      }}
                    >
                      {estaAgregado ? '✅ En carrito' : estaAgregando ? '⏳ Agregando...' : 'Agregar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTROS + BUSCADOR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px 32px', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['Todos', 'Mejores Desc.', 'Precio bajo'].map((label, i) => (
            <button key={i} onClick={() => setFiltro(['todos', 'mejores-descuentos', 'precio-bajo'][i])}
              style={{
                padding: '10px 20px', borderRadius: 30, border: 'none', fontWeight: 'bold', fontSize: 14,
                backgroundColor: filtro === ['todos', 'mejores-descuentos', 'precio-bajo'][i] ? '#C084FC' : 'rgba(192,132,252,0.15)',
                color: filtro === ['todos', 'mejores-descuentos', 'precio-bajo'][i] ? 'white' : '#C084FC',
                cursor: 'pointer', transition: 'all 0.3s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {label}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Buscar motel o ciudad..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: '12px 20px', borderRadius: 30, border: '2px solid rgba(192,132,252,0.3)', backgroundColor: 'rgba(30,30,40,0.9)', color: 'white', fontSize: 15, width: '320px', outline: 'none', transition: 'all 0.3s' }}
          onFocus={e => e.target.style.borderColor = '#C084FC'}
          onBlur={e => e.target.style.borderColor = 'rgba(192,132,252,0.3)'} />
      </div>

      {/* GRID DE CUPONES */}
      <div className="cupones-grid">
        {cuponesFiltrados().map((cupon, i) => {
          const cantidad = conteoPorHabitacion[cupon.habitacion_id] || 0;
          if (cantidad === 0) return null;

          const estaAgregando = agregando.has(cupon.id);
          const estaAgregado = agregados.has(cupon.id);

          return (
            <div key={cupon.id} className="cupon-card" style={{ animation: `fadeInUp 0.5s ease-out ${i * 0.05}s both` }}>
              {cupon.establecimientos?.cover_image && (
                <div style={{ position: 'relative', height: 140 }}>
                  <img src={cupon.establecimientos.cover_image} alt={cupon.establecimientos.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div className="badge-disponibles">
                    <span>{cantidad} disponibles</span>
                  </div>
                </div>
              )}

              <div style={{ padding: 16 }}>
                <h3 style={{ color: 'white', fontSize: 17, fontWeight: 'bold', margin: '0 0 8px', lineHeight: 1.3 }}>
                  {cupon.nombre_cupon}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#A78BFA', fontSize: 14, marginBottom: 8 }}>
                  <LocationIcon /> {cupon.establecimientos?.municipio || 'Ciudad'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '12px 0' }}>
                  {cupon.descuento_porcentaje > 0 && (
                    <span style={{ color: '#64748B', fontSize: 14, textDecoration: 'line-through' }}>
                      ${cupon.precio_cupon.toLocaleString('es-MX')}
                    </span>
                  )}
                  <span style={{ color: '#C084FC', fontSize: 26, fontWeight: 'bold' }}>
                    ${Math.round(calcularPrecioFinal(cupon)).toLocaleString('es-MX')}
                  </span>
                </div>

                {/* ✅ Botón con estados visuales */}
                <button
                  onClick={() => agregarAlCarrito(cupon.id)}
                  disabled={estaAgregando || estaAgregado}
                  className={estaAgregado ? 'btn-agregado' : 'btn-agregar'}
                  onMouseEnter={e => {
                    if (!estaAgregado && !estaAgregando) {
                      e.currentTarget.style.background = '#D8B4FE';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 15px 30px rgba(192,132,252,0.5)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!estaAgregado && !estaAgregando) {
                      e.currentTarget.style.background = '#C084FC';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(192,132,252,0.4)';
                    }
                  }}
                >
                  {estaAgregado ? '✅ Agregado al carrito' : estaAgregando ? '⏳ Reservando...' : 'Agregar al carrito'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {cuponesFiltrados().filter(c => (conteoPorHabitacion[c.habitacion_id] || 0) > 0).length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎟️</div>
          <p style={{ fontSize: 18 }}>No hay cupones disponibles en este momento</p>
        </div>
      )}

      <style>{`
        .cupones-grid {
          display: grid;
          gap: 20px;
          padding: 0 24px 40px;
          max-width: 1600px;
          margin: 0 auto;
        }
        @media (max-width: 480px) { .cupones-grid { grid-template-columns: 1fr; } }
        @media (min-width: 481px) and (max-width: 767px) { .cupones-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 768px) and (max-width: 1023px) { .cupones-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .cupones-grid { grid-template-columns: repeat(4, 1fr); } }

        .cupon-card {
          background: rgba(30,30,40,0.95);
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(192,132,252,0.2);
          box-shadow: 0 8px 25px rgba(0,0,0,0.4);
          transition: all 0.4s ease;
        }
        .cupon-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(192,132,252,0.3);
        }

        .badge-disponibles {
          position: absolute;
          top: 10px; right: 10px;
          background: #dd4d0aff;
          color: white;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: bold;
          box-shadow: 0 0 20px rgba(231,76,29,0.7);
          animation: pulseGlow 2.5s infinite;
          z-index: 10;
        }

        .btn-agregar {
          width: 100%;
          background: #C084FC;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 16px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 6px 20px rgba(192,132,252,0.4);
        }

        .btn-agregado {
          width: 100%;
          background: #10B981;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 16px;
          font-weight: bold;
          font-size: 16px;
          cursor: not-allowed;
          transition: all 0.3s;
          box-shadow: 0 6px 20px rgba(16,185,129,0.3);
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(247,114,25,0.7); transform: scale(1); }
          50% { box-shadow: 0 0 35px rgba(243,113,80,1); transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
// src/screens/CuponesMarketplace.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function CuponesMarketplace() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cupones, setCupones] = useState([]);
  const [recomendados, setRecomendados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [conteoPorHabitacion, setConteoPorHabitacion] = useState({});

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
          .gte('validity_end', today); // ✅ Vigente hoy o en el futuro

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

        // ✅ Cargar recomendaciones después de tener cupones
        if (currentUser) {
          fetchRecomendaciones(cuponesUnicos);
        } else {
          setRecomendados(cuponesUnicos.slice(0, 3));
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCupones();
  }, [currentUser]);

  // ✅ Función de recomendación restaurada
  const fetchRecomendaciones = async (cuponesDisponibles) => {
    try {
      // Buscar cupones redimidos (status = 'redeemed')
      const { data: historial, error } = await supabase
        .from('cupones')
        .select('establecimiento_id')
        .eq('comprado_por', currentUser.id)
        .eq('status', 'redeemed'); // Más fiable que redeemed_at

      if (error) throw error;

      const motelesVisitados = [...new Set(historial.map(c => c.establecimiento_id).filter(Boolean))];

      if (motelesVisitados.length > 0) {
        const recomendados = cuponesDisponibles
          .filter(c => motelesVisitados.includes(c.establecimiento_id))
          .slice(0, 3);
        setRecomendados(recomendados.length > 0 ? recomendados : cuponesDisponibles.slice(0, 3));
      } else {
        setRecomendados(cuponesDisponibles.slice(0, 3));
      }
    } catch (err) {
      console.error('Error al cargar recomendaciones:', err);
      setRecomendados(cuponesDisponibles.slice(0, 3));
    }
  };

  // ✅ Función corregida: agregar al carrito con validación completa
    const agregarAlCarrito = async (cuponId) => {
      if (!currentUser) {
        alert('Inicia sesión para agregar al carrito');
        navigate('/login');
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        
        // ✅ Usa maybeSingle() para evitar error si no hay resultado
        const { data: cupon, error: cuponError } = await supabase
          .from('cupones')
          .select('id, status')
          .eq('id', cuponId)
          .eq('status', 'onSale')
          .is('redeemed_at', null)
          .gte('validity_end', today)
          .maybeSingle(); // ← clave: no lanza error si no hay resultado

        if (cuponError) {
          console.error('Error en validación de cupón:', cuponError);
          alert('❌ Error al verificar el cupón.');
          return;
        }

        if (!cupon) {
          // ✅ Este es el caso real: cupón no cumple las condiciones
          alert('Este cupón ya no está disponible.');
          return;
        }

        // Insertar en carritos
        const { error: carritoError } = await supabase
          .from('carritos')
          .insert({
            usuario_id: currentUser.id,
            cupon_id: cuponId,
            status: 'active',
            created_at: new Date().toISOString()
          });

        if (carritoError) {
          console.error('Error al agregar al carrito:', carritoError);
          throw carritoError;
        }

        alert('✅ Cupón agregado al carrito');
      } catch (err) {
        console.error('Error en agregarAlCarrito:', err);
        alert('❌ No se pudo agregar el cupón al carrito. Inténtalo más tarde.');
      }
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
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#e2e8f0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
        <button onClick={() => navigate(-1)} style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(192,132,252,0.15)', border: '2px solid rgba(192,132,252,0.3)', color: '#C084FC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,132,252,0.3)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(192,132,252,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}>
          <BackIcon />
        </button>
        <h1 style={{ color: '#C084FC', fontSize: 28, fontWeight: 'bold', margin: 0 }}>Cupones Disponibles</h1>
        <button onClick={() => navigate('/carrito')} style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(236,72,153,0.15)', border: '2px solid rgba(236,72,153,0.3)', color: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(236,72,153,0.3)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(236,72,153,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}>
          <CartIcon />
        </button>
      </div>

      {/* ✅ SECCIÓN DE RECOMENDADOS */}
      {recomendados.length > 0 && (
        <div style={{ padding: '0 24px 24px' }}>
          <h2 style={{ color: '#DDD6FE', fontSize: 19, margin: '0 0 16px' }}>
            🎯 Para ti
          </h2>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12 }}>
            {recomendados.map((cupon, i) => {
              const cantidad = conteoPorHabitacion[cupon.habitacion_id] || 0;
              if (cantidad === 0) return null;
              return (
                <div key={`rec-${cupon.id}`} style={{ 
                  minWidth: 220, 
                  background: 'rgba(30,30,40,0.95)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid rgba(192,132,252,0.2)',
                  flexShrink: 0 
                }}>
                  {cupon.establecimientos?.cover_image && (
                    <img
                      src={cupon.establecimientos.cover_image}
                      alt={cupon.establecimientos.nombre}
                      style={{ width: '100%', height: 120, objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ padding: 12 }}>
                    <h3 style={{ fontSize: 14, margin: '0 0 6px', color: 'white' }}>
                      {cupon.nombre_cupon}
                    </h3>
                    <p style={{ fontSize: 12, color: '#A78BFA', margin: '0 0 8px' }}>
                      {cupon.establecimientos?.municipio}
                    </p>
                    <p style={{ fontSize: 16, color: '#C084FC', fontWeight: 'bold', margin: 0 }}>
                      ${Math.round(calcularPrecioFinal(cupon)).toLocaleString('es-MX')}
                    </p>
                    <button
                      onClick={() => agregarAlCarrito(cupon.id)}
                      style={{
                        width: '100%',
                        background: '#C084FC',
                        color: 'white',
                        border: 'none',
                        padding: '6px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 'bold',
                        marginTop: 8
                      }}
                    >
                      Agregar
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
              style={{ padding: '10px 20px', borderRadius: 30, border: 'none', fontWeight: 'bold', fontSize: 14,
                backgroundColor: filtro === ['todos', 'mejores-descuentos', 'precio-bajo'][i] ? '#C084FC' : 'rgba(192,132,252,0.15)',
                color: filtro === ['todos', 'mejores-descuentos', 'precio-bajo'][i] ? 'white' : '#C084FC',
                cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {label}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Buscar motel o ciudad..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: '12px 20px', borderRadius: 30, border: '2px solid rgba(192,132,252,0.3)', backgroundColor: 'rgba(30,30,40,0.9)', color: 'white', fontSize: 15, width: '320px', outline: 'none', transition: 'all 0.3s' }}
          onFocus={e => e.target.style.borderColor = '#C084FC'} onBlur={e => e.target.style.borderColor = 'rgba(192,132,252,0.3)'} />
      </div>

      {/* GRID RESPONSIVE */}
      <div className="cupones-grid">
        {cuponesFiltrados().map((cupon, i) => {
          const cantidad = conteoPorHabitacion[cupon.habitacion_id] || 0;
          if (cantidad === 0) return null;

          return (
            <div key={cupon.id} className="cupon-card" style={{ animation: `fadeInUp 0.5s ease-out ${i * 0.05}s both` }}>
              {cupon.establecimientos?.cover_image && (
                <div style={{ position: 'relative', height: 140 }}>
                  <img src={cupon.establecimientos.cover_image} alt={cupon.establecimientos.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {/* ETIQUETA CON DESTELLO RECUPERADO Y MEJORADO */}
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

                {/* ✅ Botón corregido */}
                <button onClick={() => agregarAlCarrito(cupon.id)} className="btn-agregar">
                  Agregar al carrito
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ESTILOS GLOBALES CON EL PULSE GLOW RECUPERADO */}
      <style jsx global>{`
        .cupones-grid {
          display: grid;
          gap: 20px;
          padding: 0 24px;
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
        .cupon-card:hover { transform: translateY(-8px); }

        /* ETIQUETA CON DESTELLO PREMIUM RECUPERADO */
        .badge-disponibles {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #dd4d0aff;
          color: white;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: bold;
          box-shadow: 0 0 20px rgba(231, 76, 29, 0.7);
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
        .btn-agregar:hover {
          background: #E9D5FF;
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(192,132,252,0.5);
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

        /* ANIMACIÓN DE DESTELLO RECUPERADA Y MEJORADA */
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(247, 114, 25, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 35px rgba(243, 113, 80, 1);
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
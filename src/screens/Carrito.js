// src/screens/Carrito.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function Carrito() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [carritoItems, setCarritoItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesandoPago, setProcesandoPago] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    fetchCarrito();
  }, [currentUser, navigate]);

  const fetchCarrito = async () => {
    setLoading(true);
    try {
      console.log('🛒 Cargando carrito para usuario:', currentUser.id);
      
      const { data: items, error } = await supabase
        .from('carritos')
        .select(`
          id,
          cupon_id,
          created_at,
          cupones!inner (
            id,
            nombre_cupon,
            precio_cupon,
            validity_end,
            establecimiento_id,
            habitacion_id
          )
        `)
        .eq('usuario_id', currentUser.id)
        .eq('status', 'active');

      if (error) {
        console.error('❌ Error Supabase:', error);
        throw error;
      }

      console.log('✅ Items del carrito:', items);

      const validItems = (items || []).filter(item => item.cupones);
      
      const itemsConDetalles = await Promise.all(
        validItems.map(async (item) => {
          const cupon = item.cupones;
          
          let establecimiento = null;
          if (cupon.establecimiento_id) {
            const { data: est } = await supabase
              .from('establecimientos')
              .select('id, nombre, conditions')
              .eq('id', cupon.establecimiento_id)
              .single();
            establecimiento = est;
          }
          
          let habitacion = null;
          if (cupon.habitacion_id) {
            const { data: hab } = await supabase
              .from('habitaciones')
              .select('id, nombre, capacidad, precio')
              .eq('id', cupon.habitacion_id)
              .single();
            habitacion = hab;
          }
          
          return {
            ...item,
            cupones: {
              ...cupon,
              establecimientos: establecimiento,
              habitaciones: habitacion
            }
          };
        })
      );

      console.log('✅ Items con detalles:', itemsConDetalles);
      setCarritoItems(itemsConDetalles);
    } catch (err) {
      console.error('💥 Error al cargar carrito:', err);
      alert('No se pudo cargar tu carrito. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const eliminarDelCarrito = async (carritoId) => {
    if (!window.confirm('¿Eliminar este cupón del carrito?')) return;

    try {
      const { error } = await supabase
        .from('carritos')
        .delete()
        .eq('id', carritoId)
        .eq('usuario_id', currentUser.id);

      if (error) throw error;
      
      fetchCarrito();
    } catch (err) {
      console.error('❌ Error al eliminar:', err);
      alert('No se pudo eliminar el cupón.');
    }
  };

  const procesarPago = async () => {
    if (carritoItems.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    if (!window.confirm(`¿Confirmar compra de ${carritoItems.length} cupón(es) por $${calcularTotal().toLocaleString('es-MX')}?`)) return;
    setProcesandoPago(true);

    try {
      const cuponIds = carritoItems.map(item => item.cupon_id);

      const { data: disponibles, error: validError } = await supabase
        .from('cupones')
        .select('id')
        .in('id', cuponIds)
        .eq('status', 'onSale')
        .is('comprado_por', null)
        .is('redeemed_at', null);

      if (validError) throw validError;
      if (!disponibles || disponibles.length !== cuponIds.length) {
        alert('Algunos cupones ya no están disponibles. Actualizando carrito...');
        fetchCarrito();
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      const { error: cuponesError } = await supabase
        .from('cupones')
        .update({
          status: 'sold',
          comprado_por: currentUser.id
        })
        .in('id', cuponIds)
        .eq('status', 'onSale'); 

      if (cuponesError) {
        console.error('Error al actualizar cupones:', cuponesError);
        throw cuponesError;
      }

      const { error: carritoError } = await supabase
        .from('carritos')
        .update({ status: 'purchased' })
        .in('id', carritoItems.map(i => i.id))
        .eq('usuario_id', currentUser.id);

      if (carritoError) throw carritoError;

      alert('✅ ¡Compra exitosa!\nTus cupones ya están listos para usar.');
      navigate('/mis-cupones');

    } catch (err) {
      console.error('💥 Error en compra:', err);
      alert('Error al procesar la compra. Inténtalo más tarde.');
    } finally {
      setProcesandoPago(false);
    }
  };

  const calcularTotal = () => {
    return carritoItems.reduce((total, item) => {
      const precio = item.cupones?.habitaciones?.precio || item.cupones?.precio_cupon || 0;
      return total + precio;
    }, 0);
  };

  if (loading) {
    return (
      <div style={{ 
        backgroundColor: '#0F0F1B', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        color: '#E0E0FF',
        gap: 16
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: '4px solid rgba(192, 132, 252, 0.3)',
          borderTop: '4px solid #C084FC',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#94a3b8', margin: 0 }}>Cargando carrito...</p>
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
      {/* HEADER ESTILIZADO */}
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
          Mi Carrito
          {carritoItems.length > 0 && (
            <span style={{ 
              fontSize: 18, 
              color: '#94a3b8',
              marginLeft: 8
            }}>
              ({carritoItems.length})
            </span>
          )}
        </h1>

        <div style={{ width: 44 }} />
      </div>

      {/* CONTENIDO */}
      {carritoItems.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'rgba(192, 132, 252, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40
          }}>
            🛒
          </div>
          <div>
            <p style={{ 
              fontSize: 20, 
              color: '#E0E0FF',
              margin: '0 0 8px',
              fontWeight: 'bold'
            }}>
              Tu carrito está vacío
            </p>
            <p style={{ 
              fontSize: 14, 
              color: '#9CA3AF',
              margin: 0
            }}>
              Explora nuestros cupones y comienza a ahorrar
            </p>
          </div>
          <button
            onClick={() => navigate('/cupones')}
            style={{
              backgroundColor: '#EC4899',
              color: 'white',
              border: 'none',
              padding: '14px 32px',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#DB2777';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(236, 72, 153, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#EC4899';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.3)';
            }}
          >
            🎫 Explorar Cupones
          </button>
        </div>
      ) : (
        <div>
          {/* LISTA DE ITEMS */}
          <div style={{ marginBottom: 24 }}>
            {carritoItems.map(item => (
              <div key={item.id} style={{
                backgroundColor: 'rgba(30, 30, 40, 0.7)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                border: '1px solid rgba(192, 132, 252, 0.2)',
                position: 'relative',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.4)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.2)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
              >
                {/* Botón eliminar mejorado */}
                <button
                  onClick={() => eliminarDelCarrito(item.id)}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                    fontSize: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  ✕
                </button>
                
                <h3 style={{ 
                  color: '#E0E0FF', 
                  margin: '0 40px 8px 0', 
                  fontSize: 18,
                  fontWeight: 'bold'
                }}>
                  {item.cupones?.nombre_cupon || 'Cupón sin nombre'}
                </h3>
                
                {item.cupones?.establecimientos && (
                  <p style={{ color: '#A78BFA', margin: '0 0 6px', fontSize: 14 }}>
                    🏨 {item.cupones.establecimientos.nombre}
                  </p>
                )}
                
                {item.cupones?.habitaciones && (
                  <div style={{ 
                    marginTop: 12,
                    backgroundColor: 'rgba(192, 132, 252, 0.1)',
                    padding: 12,
                    borderRadius: 8
                  }}>
                    <p style={{ color: '#E0E0FF', margin: '0 0 4px', fontSize: 14, fontWeight: '600' }}>
                      🛏️ {item.cupones.habitaciones.nombre}
                    </p>
                    <p style={{ color: '#9CA3AF', margin: '0 0 8px', fontSize: 12 }}>
                      Capacidad: {item.cupones.habitaciones.capacidad || '—'} personas
                    </p>
                    <p style={{ color: '#C084FC', margin: 0, fontSize: 20, fontWeight: 'bold' }}>
                      ${item.cupones.habitaciones.precio?.toLocaleString('es-MX') || '—'}
                    </p>
                  </div>
                )}

                {!item.cupones?.habitaciones && item.cupones?.precio_cupon && (
                  <p style={{ color: '#C084FC', margin: '12px 0', fontSize: 20, fontWeight: 'bold' }}>
                    ${item.cupones.precio_cupon.toLocaleString('es-MX')}
                  </p>
                )}

                {item.cupones?.establecimientos?.conditions?.length > 0 && (
                  <div style={{ 
                    marginTop: 12, 
                    padding: 10, 
                    borderTop: '1px solid rgba(192, 132, 252, 0.2)',
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    borderRadius: 6
                  }}>
                    <p style={{ fontSize: 12, color: '#FCD34D', margin: '0 0 6px', fontWeight: 'bold' }}>
                      ⚠️ Condiciones:
                    </p>
                    {item.cupones.establecimientos.conditions.map((cond, idx) => (
                      <p key={idx} style={{ fontSize: 11, color: '#FDE68A', margin: '3px 0' }}>
                        • {cond}
                      </p>
                    ))}
                  </div>
                )}

                <p style={{ 
                  color: '#9CA3AF', 
                  fontSize: 12, 
                  margin: '12px 0 0'
                }}>
                  📅 Válido hasta: {new Date(item.cupones?.validity_end).toLocaleDateString('es-MX')}
                </p>
              </div>
            ))}
          </div>

          {/* RESUMEN DE COMPRA */}
          <div style={{
            backgroundColor: 'rgba(192, 132, 252, 0.1)',
            borderRadius: 16,
            padding: 24,
            border: '1px solid rgba(192, 132, 252, 0.3)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: 20,
              alignItems: 'baseline'
            }}>
              <span style={{ color: '#E0E0FF', fontSize: 16, fontWeight: '600' }}>
                Total ({carritoItems.length} cupón{carritoItems.length !== 1 ? 'es' : ''}):
              </span>
              <span style={{ color: '#C084FC', fontSize: 28, fontWeight: 'bold' }}>
                ${calcularTotal().toLocaleString('es-MX')}
              </span>
            </div>
            
            <button
              onClick={procesarPago}
              disabled={procesandoPago}
              style={{
                backgroundColor: procesandoPago ? '#6B7280' : '#10B981',
                color: 'white',
                border: 'none',
                width: '100%',
                padding: '16px',
                fontSize: 17,
                fontWeight: 'bold',
                borderRadius: 12,
                cursor: procesandoPago ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: procesandoPago ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                opacity: procesandoPago ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!procesandoPago) {
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!procesandoPago) {
                  e.target.style.backgroundColor = '#10B981';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }
              }}
            >
              {procesandoPago ? '⏳ Procesando pago...' : '💳 Confirmar Compra'}
            </button>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 16
            }}>
              <span style={{ fontSize: 20 }}>🔒</span>
              <p style={{
                fontSize: 13,
                color: '#9CA3AF',
                margin: 0
              }}>
                Pago 100% seguro y protegido
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
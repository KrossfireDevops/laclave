// src/screens/MotelDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import VisitorPopup from '../components/VisitorPopup'; // ✅ NUEVO IMPORT
import RegisterModal from '../components/RegisterModal'; // ✅ NUEVO IMPORT

export default function MotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [motel, setMotel] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [submittingRedemption, setSubmittingRedemption] = useState(false);
  
  // ✅ Estados para PopUp de visitantes
  const [showVisitorPopup, setShowVisitorPopup] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const fetchUserCoupons = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('cupones')
        .select('*')
        .eq('comprado_por', currentUser.id)
        .eq('status', 'sold')
        .is('redeemed_at', null)
        .lte('validity_start', today)
        .gte('validity_end', today);

      if (error) {
        console.error('Error al cargar cupones:', error);
      }
    } catch (err) {
      console.error('Error al cargar cupones:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('❌ ID inválido');
      setTimeout(() => navigate('/'), 1000);
      return;
    }

    const cleanId = id.trim();
    let isMounted = true;

    const fetchMotel = async () => {
      try {
        const { data: est, error: estError } = await supabase
          .from('establecimientos')
          .select('*')
          .eq('id', cleanId)
          .single();

        if (!isMounted) return;
        if (estError) {
          console.error('❌ Error al cargar motel:', estError);
          setLoading(false);
          setTimeout(() => navigate('/'), 2000);
          return;
        }
        if (!est) {
          console.warn('⚠️ Motel no encontrado');
          setLoading(false);
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        const { data: rooms, error: roomError } = await supabase
          .from('habitaciones')
          .select('*')
          .eq('establecimiento_id', cleanId)
          .order('precio', { ascending: true });

        if (roomError) {
          console.error('⚠️ Error al cargar habitaciones:', roomError);
        } else {
          console.log('✅ Habitaciones cargadas:', rooms);
        }

        if (isMounted) {
          setMotel({ 
            ...est, 
            rooms: rooms || [] 
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('💥 Error inesperado:', err);
        if (isMounted) {
          setLoading(false);
          setTimeout(() => navigate('/'), 2000);
        }
      }
    };

    fetchMotel();
    return () => { isMounted = false; };
  }, [id, navigate]);

  useEffect(() => {
    fetchUserCoupons();
  }, [fetchUserCoupons]);

  // ✅ Función actualizada con PopUp para visitantes
  const handleCallCheckIn = (room) => {
    if (!currentUser) {
      setShowVisitorPopup(true);
      return;
    }
    setSelectedRoom(room);
    setRoomNumber('');
    setShowRoomModal(true);
  };

  const submitRedemption = async () => {
    if (!roomNumber.trim()) {
      alert('Por favor, ingresa el número de habitación.');
      return;
    }

    setSubmittingRedemption(true);
    try {
      const { data: cupones, error } = await supabase
        .from('cupones')
        .select('id')
        .eq('comprado_por', currentUser.id)
        .eq('establecimiento_id', motel.id)
        .eq('habitacion_id', selectedRoom.id)
        .eq('status', 'sold')
        .limit(1);

      if (error) throw error;
      if (!cupones || cupones.length === 0) {
        alert('❌ El motel o habitación es incorrecto.\nVerifica que tengas un cupón válido para este lugar.');
        setShowRoomModal(false);
        setSubmittingRedemption(false);
        return;
      }

      const cuponId = cupones[0].id;

      const userId = currentUser.id;
      if (!userId || userId.length !== 36 || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        console.error('❌ ID de usuario inválido:', userId);
        alert('Error: tu sesión no es válida. Por favor, inicia sesión de nuevo.');
        setShowRoomModal(false);
        setSubmittingRedemption(false);
        return;
      }

      const { error: redencionError } = await supabase
        .from('redenciones')
        .insert({
          cupon_id: cuponId,
          cliente_id: userId,
          status: 'pendiente',
          room_number: roomNumber.trim(),
          requested_at: new Date().toISOString()
        });

      if (redencionError) throw redencionError;

      await supabase
        .from('cupones')
        .update({ status: 'pending_redemption' })
        .eq('id', cuponId);

      alert('✅ Solicitud de redención enviada.\nEl proveedor la revisará pronto.');
      setShowRoomModal(false);
      fetchUserCoupons();

    } catch (err) {
      console.error('Error al solicitar redención:', err);
      alert('❌ Error al procesar la solicitud. Inténtalo más tarde.');
    } finally {
      setSubmittingRedemption(false);
    }
  };

  const handleOpenMaps = () => {
    if (!motel?.coords) return;
    const { latitude, longitude } = motel.coords;
    const url = `https://www.google.com/maps/dir/?api=1&destination=  ${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    if (!motel) return;
    const url = `${window.location.origin}/motel/${id}`;
    const message = `¡Mira este lugar en LaClave!\n\n${motel.nombre}\n📍 ${motel.direccion || 'Dirección no disponible'}\n\n${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: motel.nombre, text: message });
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(message);
          alert('Enlace copiado al portapapeles');
        }
      }
    } else {
      navigator.clipboard.writeText(message);
      alert('Enlace copiado al portapapeles');
    }
  };

  const handleImageClick = () => {
    const allImages = [motel.cover_image];
    motel.rooms.forEach(room => {
      if (room.imagenes && Array.isArray(room.imagenes)) {
        allImages.push(...room.imagenes);
      }
    });
    const validImages = allImages.filter(img => img);
    
    if (validImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        backgroundColor: '#0F0F1B', 
        minHeight: '100vh', 
        color: '#E0E0FF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
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
        <p style={{ color: '#9CA3AF', marginTop: 16 }}>Cargando detalles...</p>
      </div>
    );
  }

  if (!motel) {
    return (
      <div style={{ 
        padding: 40, 
        textAlign: 'center', 
        color: '#F87171',
        backgroundColor: '#0F0F1B',
        minHeight: '100vh'
      }}>
        <h2>Motel no encontrado</h2>
        <button 
          onClick={() => navigate('/')} 
          style={{ 
            color: '#C084FC', 
            marginTop: 16,
            background: 'none',
            border: 'none',
            fontSize: 16,
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          ← Volver al inicio
        </button>
      </div>
    );
  }

  const allImages = [motel.cover_image];
  motel.rooms.forEach(room => {
    if (room.imagenes && Array.isArray(room.imagenes)) {
      allImages.push(...room.imagenes);
    }
  });
  const validImages = allImages.filter(img => img);

  return (
    <div style={{ 
      backgroundColor: '#0F0F1B', 
      minHeight: '100vh',
      color: '#E0E0FF'
    }}>
      
      {/* ✅ PopUp para visitantes */}
      <VisitorPopup
        isOpen={showVisitorPopup}
        onClose={() => setShowVisitorPopup(false)}
        onRegister={() => {
          setShowVisitorPopup(false);
          setShowRegisterModal(true);
        }}
      />

      {/* ✅ Modal de registro */}
      {showRegisterModal && (
        <RegisterModal 
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
        />
      )}

      {showRoomModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            backgroundColor: '#1F2937',
            borderRadius: 16,
            padding: 24,
            maxWidth: 420,
            width: '100%',
            border: '1px solid rgba(192, 132, 252, 0.4)',
            color: '#E0E0FF'
          }}>
            <h3 style={{ color: '#C084FC', margin: '0 0 16px', fontSize: 20 }}>
              🏨 Confirma tu habitación
            </h3>
            <p style={{ color: '#9CA3AF', marginBottom: 16, fontSize: 14 }}>
              Estás en <strong>{motel.nombre}</strong><br />
              Por favor, ingresa el número de tu habitación real:
            </p>
            <input
              type="text"
              placeholder="Ej. 101, Suite A, 2B..."
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 10,
                border: '1px solid rgba(192,132,252,0.4)',
                backgroundColor: 'rgba(30,30,40,0.9)',
                color: 'white',
                fontSize: 16,
                outline: 'none',
                marginBottom: 20,
                boxSizing: 'border-box'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={submitRedemption}
                disabled={submittingRedemption}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: submittingRedemption ? '#6B7280' : '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 'bold',
                  cursor: submittingRedemption ? 'not-allowed' : 'pointer',
                  fontSize: 16
                }}
              >
                {submittingRedemption ? 'Enviando...' : 'Solicitar redención'}
              </button>
              <button
                onClick={() => setShowRoomModal(false)}
                disabled={submittingRedemption}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'rgba(156,163,175,0.2)',
                  color: '#9CA3AF',
                  border: '1px solid rgba(156,163,175,0.3)',
                  borderRadius: 10,
                  fontWeight: 'bold',
                  cursor: submittingRedemption ? 'not-allowed' : 'pointer',
                  fontSize: 16
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', paddingTop: 10 }}>
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
        <div style={{ display: 'flex', gap: 16 }}>
          <button 
            onClick={handleShare} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#A78BFA', 
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>
        </div>
      </div>

      <div style={{ 
        padding: '0 20px',
        display: window.innerWidth < 768 ? 'flex' : 'grid',
        flexDirection: window.innerWidth < 768 ? 'column' : undefined,
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
        gap: window.innerWidth < 768 ? 24 : 40,
        marginBottom: 32
      }}>
        <div style={{ 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 24
        }}>
          <div style={{ 
            position: 'relative', 
            height: window.innerWidth < 768 ? 350 : 600 
          }} onClick={handleImageClick}>
            {validImages.length > 0 ? (
              <img
                key={currentImageIndex}
                src={validImages[currentImageIndex]}
                alt={`${motel.nombre} - Imagen ${currentImageIndex + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  borderRadius: 16,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x420/333/C084FC?text=Imagen+no+disponible  ';
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#1F2937',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9CA3AF',
                fontSize: 18,
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}>
                Sin imágenes disponibles
              </div>
            )}
            {validImages.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: 16,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                gap: 6
              }}>
                {validImages.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: currentImageIndex === i ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: currentImageIndex === i ? '#C084FC' : 'rgba(192, 132, 252, 0.4)',
                      transition: 'all 0.3s'
                    }}
                  />
                ))}
              </div>
            )}
            <div style={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: 'rgba(15, 15, 27, 0.7)',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 'bold',
              color: 'white'
            }}>
              {currentImageIndex + 1} / {validImages.length}
            </div>
          </div>

          {motel.amenities && motel.amenities.length > 0 && (
              <div>
                <h3 style={{ fontSize: 17, margin: '0 0 10px', color: '#DDD6FE' }}>Servicios:</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {motel.amenities.map((amenity, idx) => (
                    <span key={idx} style={{ 
                      backgroundColor: 'rgba(192, 132, 252, 0.2)',
                      color: '#E0E0FF',
                      padding: '4px 10px',
                      borderRadius: 16,
                      fontSize: 12
                    }}>
                      ✓ {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ✅ NUEVA SECCIÓN: Condiciones del establecimiento */}
            {motel.conditions && motel.conditions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: 17, margin: '0 0 10px', color: '#FBBF24' }}>Condiciones:</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {motel.conditions.map((condition, idx) => (
                    <span key={idx} style={{ 
                      backgroundColor: 'rgba(251, 191, 36, 0.15)',
                      color: '#FBBF24',
                      padding: '4px 10px',
                      borderRadius: 16,
                      fontSize: 12,
                      border: '1px solid rgba(251, 191, 36, 0.3)'
                    }}>
                      ⚠️ {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}

          <div>
            <p style={{ fontSize: 15, margin: '6px 0', color: '#C4B5FD' }}>
              📍 {motel.direccion || 'Dirección no disponible'}
            </p>
            {motel.colony && (
              <p style={{ fontSize: 14, margin: '4px 0', color: '#9CA3AF' }}>
                {motel.colony}, {motel.municipio || ''}
              </p>
            )}
            <p style={{ fontSize: 15, margin: '6px 0', color: '#A78BFA' }}>
              📞 {motel.telefono || 'Teléfono no disponible'}
            </p>
          </div>

          {motel.coords && (
            <button
              onClick={handleOpenMaps}
              style={{
                width: '100%',
                maxWidth: '300px',
                backgroundColor: '#9436f3',
                color: 'white',
                border: 'none',
                padding: '16px 24px',
                borderRadius: 16,
                fontSize: 16,
                fontWeight: 'bold',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 15px rgba(148, 54, 243, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#9e3ff8ff';
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.04)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(102, 8, 196, 0.78)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#9436f3';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(148, 54, 243, 0.35)';
              }}
            >
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span
                  style={{
                    content: '""',
                    position: 'absolute',
                    inset: -8,
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderRadius: '50%',
                    animation: 'pulse 2.5s infinite',
                  }}
                />
              </span>
              Vamos al motel
              <style>{`
                @keyframes pulse {
                  0% { transform: scale(0.8); opacity: 0.6; }
                  70% { transform: scale(1.3); opacity: 0; }
                  100% { transform: scale(1.5); opacity: 0; }
                }
              `}</style>
            </button>
          )}
        </div>

        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: 24
        }}>
          <div>
            <h1 style={{ fontSize: 28, margin: '0 0 8px', color: '#E0E0FF' }}>{motel.nombre}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex' }}>
                {[1, 2, 3, 4, 5].map(star => {
                  const fill = Math.min(1, Math.max(0, (motel.rating || 0) - (star - 1)));
                  return (
                    <div key={star} style={{ position: 'relative', width: 22, height: 22 }}>
                      <span style={{ position: 'absolute', color: '#4B5563', fontSize: 22 }}>☆</span>
                      {fill > 0 && (
                        <div style={{ 
                          position: 'absolute', 
                          width: `${fill * 100}%`, 
                          height: '100%', 
                          overflow: 'hidden' 
                        }}>
                          <span style={{ color: '#FFD700', fontSize: 22 }}>★</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <span style={{
                backgroundColor: 'rgba(192, 132, 252, 0.2)',
                color: '#C084FC',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 'bold'
              }}>
                {motel.rating ? motel.rating.toFixed(1) : '—'}
              </span>
            </div>
          </div>

          {/* HABITACIONES */}
          {motel.rooms && motel.rooms.length > 0 ? (
            <div>
              <h2 style={{ fontSize: 19, margin: '0 0 16px', color: '#DDD6FE' }}>
                Habitaciones ({motel.rooms.length})
              </h2>
              {motel.rooms.map((room, idx) => {
                const roomImage = room.imagenes && room.imagenes.length > 0 
                  ? room.imagenes[0] 
                  : motel.cover_image;
                
                return (
                  <div 
                    key={room.id || idx} 
                    style={{ 
                      backgroundColor: 'rgba(30, 30, 40, 0.7)',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(192, 132, 252, 0.2)',
                      marginBottom: 14,
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(45, 45, 60, 0.85)';
                      e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(30, 30, 40, 0.7)';
                      e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.2)';
                    }}
                    onClick={() => {
                      const allImgs = [motel.cover_image];
                      motel.rooms.forEach(r => {
                        if (r.imagenes && Array.isArray(r.imagenes)) {
                          allImgs.push(...r.imagenes);
                        }
                      });
                      const targetIndex = allImgs.indexOf(roomImage);
                      if (targetIndex !== -1) {
                        setCurrentImageIndex(targetIndex);
                      }
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        margin: '0', 
                        fontSize: 15, 
                        color: '#E0E0FF', 
                        fontWeight: 'bold' 
                      }}>
                        {room.nombre || 'Habitación'}
                      </p>
                      <p style={{ 
                        fontSize: 11, 
                        color: '#9CA3AF', 
                        margin: '3px 0 0 0' 
                      }}>
                        Capacidad: {room.capacidad || 0} {room.capacidad === 1 ? 'persona' : 'personas'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <p style={{ 
                        color: '#C084FC', 
                        fontSize: 17, 
                        fontWeight: 'bold',
                        minWidth: 70,
                        textAlign: 'right'
                      }}>
                        ${room.precio ? room.precio.toLocaleString('es-MX') : '—'}
                      </p>
                      
                      {/* Botón CHECK IN - PROTEGIDO ✅ */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCallCheckIn(room); // ✅ FUNCIÓN PROTEGIDA
                        }}
                        style={{
                          backgroundColor: 'rgba(248, 35, 248, 0.84)',
                          color: 'white',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgba(237, 123, 252, 0.61)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'rgba(248, 35, 248, 0.84)';
                        }}
                      >
                        <span>🔑</span> CHECK IN
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              padding: 12,
              borderRadius: 10,
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <h2 style={{ fontSize: 18, margin: '0 0 8px', color: '#F87171' }}>
                Habitaciones
              </h2>
              <p style={{ color: '#9CA3AF', margin: 0, fontSize: 14 }}>
                No hay habitaciones registradas para este motel.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
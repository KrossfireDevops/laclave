// src/screens/PublicHome.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from '../components/LoginModal';     // ✅ Importamos modal de login
import RegisterModal from '../components/RegisterModal'; // ✅ Importamos modal de registro

// Función para parsear coordenadas
const parseCoords = (coords) => {
  if (!coords) return null;
  
  if (coords.latitude && coords.longitude) {
    return coords;
  }
  
  if (typeof coords === 'string') {
    const parts = coords.split(',').map(s => s.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
  }
  
  return null;
};

export default function PublicHome() {
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();
  const [moteles, setMoteles] = useState([]);
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMoteles, setLoadingMoteles] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);       // ✅ Estado login
  const [isRegisterOpen, setIsRegisterOpen] = useState(false); // ✅ Estado registro
  const menuRef = useRef(null);
  const profileMenuRef = useRef(null);

  const handleRegister = () => {
    setIsRegisterOpen(true);
  };

  const handleBannerClick = () => {
    handleRegister();
  };

  const handleOpenMaps = (motel) => {
    const coords = parseCoords(motel?.coords);
    if (!coords) {
      alert('📍 Ubicación no disponible para este motel.');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}`;
    window.open(url, '_blank');
  };

  const handleNavigate = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    await signOut();
    navigate('/');
  };

  // Cargar banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: banners, error } = await supabase
          .from('banners')
          .select('image_url, titulo, orden')
          .eq('status', 'A')
          .order('orden', { ascending: true })
          .limit(6);

        if (error) {
          console.error('❌ Error al cargar banners:', error);
        } else {
          setBanners(banners || []);
        }
      } catch (err) {
        console.error('💥 Excepción:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Cargar moteles
  useEffect(() => {
    const fetchMoteles = async () => {
      try {
        const { data: establecimientos, error } = await supabase
          .from('establecimientos')
          .select('id, nombre, rating, cover_image, direccion, colony, municipio, telefono, amenities, status, tipo, coords')
          .eq('tipo', 'motel')
          .order('rating', { ascending: false })
          .limit(10);

        if (error) {
          console.error('❌ Error al cargar moteles:', error);
        } else {
          const motelesActivos = establecimientos?.filter(m => m.status && m.status.toLowerCase().includes('activ')) || [];
          setMoteles(motelesActivos);
        }
      } catch (err) {
        console.error('💥 Excepción al cargar moteles:', err);
      } finally {
        setLoadingMoteles(false);
      }
    };
    fetchMoteles();
  }, []);

  // Rotación de banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (profileMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen, profileMenuOpen]);

  return (
    <div style={{
      backgroundColor: '#0F0F1B',
      minHeight: '100vh',
      padding: 20,
      color: '#E0E0FF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Estilos globales */}
      <style>{`
        .moteles-container::-webkit-scrollbar {
          display: none;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        position: 'relative'
      }}>
        {/* Menú hamburguesa */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              color: '#C084FC',
              cursor: 'pointer'
            }}
          >
            ☰
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute',
              top: '40px',
              left: 0,
              backgroundColor: '#1F2937',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 100,
              width: '180px',
              padding: '8px 0'
            }}>
              <button
                onClick={() => handleNavigate('/mis-cupones')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  color: '#E0E0FF',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                🎟️ Mis Cupones
              </button>
              <button
                onClick={() => handleNavigate('/favoritos')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  color: '#E0E0FF',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                ❤️ Lugares Favoritos
              </button>
            </div>
          )}
        </div>

        {/* Logo */}
        <h1 style={{ color: '#C084FC', fontSize: 32, margin: 0 }}>LaClave</h1>

        {/* Perfil o botón de login */}
        {currentUser ? (
          <div style={{ position: 'relative' }} ref={profileMenuRef}>
            <div
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#C084FC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold'
              }}>
                {(currentUser.alias || currentUser.email)?.charAt(0).toUpperCase() || 'U'}
              </div>
              <p style={{
                fontSize: 11,
                color: '#A78BFA',
                margin: '4px 0 0',
                maxWidth: 80,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {currentUser.alias || 'Mi cuenta'}
              </p>
            </div>

            {profileMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                backgroundColor: '#1F2937',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: 101,
                width: '160px',
                padding: '8px 0'
              }}>
                <button
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    color: '#F87171',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 'bold'
                  }}
                >
                  🚪 Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsLoginOpen(true)} // ✅ Abre modal de login
            style={{
              background: 'none',
              border: 'none',
              color: '#C084FC',
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            Iniciar
          </button>
        )}
      </div>

      {/* Subtítulo */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <p style={{ color: '#A78BFA', marginTop: 8, fontSize: 16 }}>
          Descubre, ahorra y vive experiencias únicas
        </p>
      </div>

      {/* Banner */}
      <div
        style={{
          width: '100%',
          height: window.innerWidth < 900 ? 220 : 280,
          marginBottom: 28,
          borderRadius: 12,
          overflow: 'hidden',
          cursor: banners.length > 0 ? 'pointer' : 'default',
          boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
          position: 'relative',
          margin: '0 auto',
        }}
        onClick={banners.length > 0 ? handleBannerClick : undefined}
      >
        {loading ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1F2937' }}>
            <div style={{
              width: 48,
              height: 48,
              border: '4px solid rgba(192, 132, 252, 0.3)',
              borderTop: '4px solid #C084FC',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : banners.length > 0 ? (
          <img
            key={currentBannerIndex}
            src={banners[currentBannerIndex].image_url}
            alt={banners[currentBannerIndex].titulo || 'Promoción LaClave'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block'
            }}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/900x600/333/FFFFFF?text=Error+de+imagen';
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#1F2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF',
            fontSize: 18
          }}>
            No hay promociones activas
          </div>
        )}
        
        {/* Indicadores */}
        {banners.length > 1 && (
          <div style={{ 
            position: 'absolute',
            bottom: 12,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 6
          }}>
            {banners.map((_, i) => (
              <div
                key={i}
                style={{
                  width: currentBannerIndex === i ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: currentBannerIndex === i ? '#C084FC' : 'rgba(192, 132, 252, 0.4)',
                  transition: 'all 0.3s'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Moteles Destacados */}
      <h3 style={{ 
        color: '#DDD6FE', 
        marginBottom: 16, 
        fontSize: 20,
        fontWeight: 'bold'
      }}>
        Moteles Destacados
      </h3>
      
      {loadingMoteles ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{
            width: 48,
            height: 48,
            border: '4px solid rgba(192, 132, 252, 0.3)',
            borderTop: '4px solid #C084FC',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <p style={{ color: '#9CA3AF', marginTop: 16 }}>Cargando moteles...</p>
        </div>
      ) : moteles.length > 0 ? (
        <div
          className="moteles-container"
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            paddingBottom: 16,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
          {moteles.map((motel) => (
            <div 
              key={motel.id} 
              onClick={() => navigate(`/motel/${motel.id}`)}
              style={{
                minWidth: 200,
                backgroundColor: 'rgba(30, 30, 40, 0.7)',
                borderRadius: 12,
                padding: 16,
                flexShrink: 0,
                border: '1px solid rgba(192, 132, 252, 0.2)',
                transition: 'transform 0.2s, border-color 0.2s',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.2)';
              }}
            >
              {motel.cover_image && (
                <div style={{
                  width: '100%',
                  height: 120,
                  borderRadius: 8,
                  overflow: 'hidden',
                  marginBottom: 12,
                  backgroundColor: '#1F2937'
                }}>
                  <img
                    src={motel.cover_image}
                    alt={motel.nombre}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x120/333/C084FC?text=Motel';
                    }}
                  />
                </div>
              )}
              
              <h4 style={{ 
                color: '#E0E0FF', 
                margin: 0, 
                fontSize: 16,
                fontWeight: 'bold'
              }}>
                {motel.nombre}
              </h4>
              
              {motel.rating && (
                <p style={{ 
                  color: '#FFD700', 
                  margin: '8px 0',
                  fontSize: 14
                }}>
                  ⭐ {parseFloat(motel.rating).toFixed(1)}
                </p>
              )}
              
              {motel.municipio && (
                <p style={{
                  color: '#9CA3AF',
                  fontSize: 12,
                  margin: '4px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  📍 {motel.municipio}
                </p>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenMaps(motel);
                }}
                style={{
                  marginTop: 10,
                  backgroundColor: 'transparent',
                  color: '#C084FC',
                  border: '1px solid #C084FC',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  width: '100%',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#C084FC';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#C084FC';
                }}
              >
                📍 Cómo llegar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          backgroundColor: 'rgba(30, 30, 40, 0.7)',
          borderRadius: 12,
          padding: 32,
          textAlign: 'center',
          border: '1px solid rgba(192, 132, 252, 0.2)'
        }}>
          <p style={{ color: '#9CA3AF', fontSize: 16 }}>
            No hay moteles disponibles en este momento.
          </p>
        </div>
      )}

      {/* Cupones Destacados */}
      <h3 style={{ 
        color: '#DDD6FE', 
        marginBottom: 16, 
        marginTop: 32, 
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        ¡Cupones Exclusivos para Ti!
      </h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: 20,
        justifyContent: 'center'
      }}>
        <div 
          onClick={() => navigate('/cupones')}
          style={{
            backgroundColor: 'linear-gradient(135deg, #C084FC 0%, #A855F7 100%)',
            borderRadius: 16,
            padding: 24,
            cursor: 'pointer',
            transition: 'transform 0.3s, box-shadow 0.3s',
            border: 'none',
            boxShadow: '0 10px 25px rgba(192, 132, 252, 0.3)',
            color: 'white',
            textAlign: 'center',
            maxWidth: 320,
            margin: '0 auto'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(192, 132, 252, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(192, 132, 252, 0.3)';
          }}
        >
          <div style={{
            fontSize: 50,
            marginBottom: 16,
            opacity: 0.9
          }}>
            🎟️
          </div>
          <h2 style={{ 
            margin: '0 0 16px', 
            fontSize: 22,
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            Acceso Prioritario
          </h2>
          <p style={{ 
            margin: '0 0 20px', 
            fontSize: 15,
            lineHeight: 1.5,
            opacity: 0.95
          }}>
            Descuentos exclusivos, experiencias únicas y ahorros reales en los mejores lugares.
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/cupones');
            }}
            style={{
              backgroundColor: 'white',
              color: '#7E22CE',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 24,
              fontWeight: 'bold',
              fontSize: 16,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              width: '100%'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#F3E8FF';
              e.target.style.transform = 'scale(1.03)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.transform = 'scale(1)';
            }}
          >
            🎉 ¡Ver Cupones Disponibles!
          </button>
        </div>
      </div>

      <p style={{ 
        textAlign: 'center', 
        marginTop: 48, 
        color: '#6B7280', 
        fontSize: 12 
      }}>
        © {new Date().getFullYear()} LaClave. Todos los derechos reservados.
      </p>

      {/* ✅ MODALES */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => setIsRegisterOpen(true)}
      />
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </div>
  );
}
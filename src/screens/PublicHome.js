// src/screens/PublicHome.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import VisitorPopup from '../components/VisitorPopup'; // ✅ NUEVO IMPORT
import { typography, homeStyles, colors } from '../styles/globalStyles';

import logoImage from '../assets/logo-laclave.png';

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
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef(null);
  const profileMenuRef = useRef(null);
  
  // ✅ Estados para PopUp de visitantes
  const [showVisitorPopup, setShowVisitorPopup] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ Función para manejar clic en botón principal
  const handleVerCupones = () => {
    if (!currentUser) {
      setShowVisitorPopup(true);
      return;
    }
    navigate('/cupones');
  };

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
    const url = `https://www.google.com/maps/dir/?api=1&destination=    ${coords.latitude},${coords.longitude}`;
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
    <div style={homeStyles.container}>
      {/* Estilos globales */}
      <style>{`
        .moteles-container::-webkit-scrollbar {
          display: none;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nav-link:hover {
          color: #C084FC;
          transform: translateY(-2px);
        }
      `}</style>

      {/* ✅ PopUp para visitantes */}
      <VisitorPopup
        isOpen={showVisitorPopup}
        onClose={() => setShowVisitorPopup(false)}
        onRegister={() => {
          setShowVisitorPopup(false);
          setIsRegisterOpen(true);
        }}
      />

      {/* HEADER RESPONSIVE */}
      <header style={{
        ...homeStyles.header,
        padding: isMobile ? '16px 20px' : '20px 40px',
        background: 'rgba(15, 15, 27, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(192, 132, 252, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}>
        {/* DISPOSITIVO MÓVIL: Menú hamburguesa a la izquierda, logo en centro */}
        {isMobile ? (
          <>
            {/* Menú hamburguesa izquierda */}
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  color: '#C084FC',
                  cursor: 'pointer',
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(192, 132, 252, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ☰
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  left: 0,
                  backgroundColor: '#1F2937',
                  borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  zIndex: 100,
                  width: '200px',
                  padding: '12px 0',
                  border: '1px solid rgba(192, 132, 252, 0.2)',
                  fontFamily: typography.fontFamilies.body,
                  animation: 'fadeInDown 0.3s ease-out',
                }}>
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        setShowVisitorPopup(true);
                        return;
                      }
                      handleNavigate('/mis-cupones');
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 20px',
                      background: 'none',
                      border: 'none',
                      color: '#E0E0FF',
                      cursor: 'pointer',
                      fontSize: 15,
                      fontFamily: typography.fontFamilies.body,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(192, 132, 252, 0.1)';
                      e.currentTarget.style.paddingLeft = '24px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.paddingLeft = '20px';
                    }}
                  >
                    🎟️ Mis Cupones
                  </button>
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        setShowVisitorPopup(true);
                        return;
                      }
                      handleNavigate('/cupones');
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 20px',
                      background: 'none',
                      border: 'none',
                      color: '#E0E0FF',
                      cursor: 'pointer',
                      fontSize: 15,
                      fontFamily: typography.fontFamilies.body,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(192, 132, 252, 0.1)';
                      e.currentTarget.style.paddingLeft = '24px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.paddingLeft = '20px';
                    }}
                  >
                    🛒 Comprar Cupones
                  </button>
                </div>
              )}
            </div>

            {/* Logo en el centro (mobile) */}
            <h1 style={{
              ...typography.logo,
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '28px',
            }}>
              LaClave
            </h1>
          </>
        ) : (
          /* DESKTOP: Logo izquierda, navegación centro, usuario derecha */
          <>
            {/* Logo a la izquierda */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                padding: '8px 0',
              }}
              onClick={() => navigate('/')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.querySelector('img').style.filter = 'drop-shadow(0 4px 12px rgba(192, 132, 252, 0.5))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.querySelector('img').style.filter = 'drop-shadow(0 2px 8px rgba(192, 132, 252, 0.3))';
              }}
            >
              <img 
                src={logoImage} 
                alt="LaClave Logo" 
                style={{
                  height: 99,
                  width: '350autopx',
                  maxWidth: '380px',
                  objectFit: 'contain',
                  marginRight: 40,
                  filter: 'drop-shadow(0 2px 8px rgba(192, 132, 252, 0.3))',
                  transition: 'all 0.3s',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const textFallback = document.createElement('h1');
                  textFallback.textContent = 'LaClave';
                  textFallback.style.cssText = `
                    font-size: 30px;
                    margin: 0;
                    margin-right: 40px;
                    background: linear-gradient(135deg, #C084FC, #EC4899);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-family: ${typography.fontFamilies.title};
                    font-weight: ${typography.weights.extraBold};
                  `;
                  e.target.parentElement.appendChild(textFallback);
                }}
              />
            </div>

            {/* Navegación central */}
            <nav style={{
              display: 'flex',
              gap: '32px',
              alignItems: 'center',
              flex: 1,
              justifyContent: 'center',
            }}>
              <button
                onClick={() => {
                  if (!currentUser) {
                    setShowVisitorPopup(true);
                    return;
                  }
                  navigate('/mis-cupones');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text,
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontFamily: typography.fontFamilies.body,
                  fontWeight: typography.weights.medium,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  transition: 'all 0.3s',
                  whiteSpace: 'nowrap',
                }}
                className="nav-link"
              >
                🎟️ Mis Cupones
              </button>
              
              <button
                onClick={() => {
                  if (!currentUser) {
                    setShowVisitorPopup(true);
                    return;
                  }
                  navigate('/cupones');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text,
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontFamily: typography.fontFamilies.body,
                  fontWeight: typography.weights.medium,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  transition: 'all 0.3s',
                  whiteSpace: 'nowrap',
                }}
                className="nav-link"
              >
                🛒 Comprar Cupones
              </button>
            </nav>
          </>
        )}

        {/* Perfil/Login a la derecha (igual para móvil y desktop) */}
        <div style={{ position: 'relative' }} ref={profileMenuRef}>
          {currentUser ? (
            <>
              <div
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                style={{ 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '50px',
                  transition: 'all 0.3s',
                  background: profileMenuOpen ? 'rgba(192, 132, 252, 0.1)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!profileMenuOpen) {
                    e.currentTarget.style.background = 'rgba(192, 132, 252, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!profileMenuOpen) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
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
                  fontWeight: 'bold',
                  fontFamily: typography.fontFamilies.title,
                  flexShrink: 0,
                }}>
                  {(currentUser.alias || currentUser.email)?.charAt(0).toUpperCase() || 'U'}
                </div>
                {!isMobile && (
                  <p style={{
                    fontSize: 14,
                    color: '#A78BFA',
                    margin: 0,
                    fontFamily: typography.fontFamilies.body,
                    fontWeight: typography.weights.medium,
                    whiteSpace: 'nowrap',
                  }}>
                    {currentUser.alias || currentUser.email?.split('@')[0] || 'Usuario'}
                  </p>
                )}
              </div>

              {profileMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '60px',
                  right: 0,
                  backgroundColor: '#1F2937',
                  borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  zIndex: 101,
                  width: isMobile ? '180px' : '200px',
                  padding: '12px 0',
                  border: '1px solid rgba(192, 132, 252, 0.2)',
                  fontFamily: typography.fontFamilies.body,
                  animation: 'fadeInDown 0.3s ease-out',
                }}>
                  <button
                    onClick={handleSignOut}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 20px',
                      background: 'none',
                      border: 'none',
                      color: '#F87171',
                      cursor: 'pointer',
                      fontSize: 15,
                      fontWeight: typography.weights.semiBold,
                      fontFamily: typography.fontFamilies.button,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.paddingLeft = '24px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.paddingLeft = '20px';
                    }}
                  >
                    🚪 Cerrar Sesión
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #C084FC, #A855F7)',
                border: 'none',
                color: 'white',
                fontSize: isMobile ? 14 : 16,
                cursor: 'pointer',
                fontFamily: typography.fontFamilies.button,
                fontWeight: typography.weights.semiBold,
                padding: isMobile ? '10px 20px' : '12px 24px',
                borderRadius: '50px',
                transition: 'all 0.3s',
                boxShadow: '0 4px 20px rgba(192, 132, 252, 0.3)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(192, 132, 252, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(192, 132, 252, 0.3)';
              }}
            >
              {isMobile ? 'Iniciar' : 'Iniciar Sesión'}
            </button>
          )}
        </div>
      </header>

      {/* Resto del contenido */}
      <div style={{ marginTop: isMobile ? '20px' : '40px' }}>
        {/* Subtítulo */}
        {/* Banner */}
        <div
          style={{
            ...homeStyles.bannerContainer,
            height: isMobile ? 220 : 400,
            marginBottom: isMobile ? 24 : 32,
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
              style={homeStyles.bannerImage}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/900x600/333/FFFFFF?text=Error+de+imagen    ';
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
              fontSize: isMobile ? 16 : 18,
              fontFamily: typography.fontFamilies.body,
              padding: '0 20px',
              textAlign: 'center',
            }}>
              No hay promociones activas en este momento
            </div>
          )}
          
          {/* Indicadores */}
          {banners.length > 1 && (
            <div style={homeStyles.bannerDots}>
              {banners.map((_, i) => (
                <div
                  key={i}
                  style={homeStyles.bannerDot(currentBannerIndex === i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Moteles Destacados */}
        <h3 style={{
          ...typography.title,
          color: '#DDD6FE',
          marginBottom: 16,
          fontSize: isMobile ? '18px' : '20px',
          paddingLeft: isMobile ? '16px' : '0',
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
            <p style={{ color: '#9CA3AF', marginTop: 16, fontFamily: typography.fontFamilies.body }}>
              Cargando moteles...
            </p>
          </div>
        ) : moteles.length > 0 ? (
          <div
            className="moteles-container"
            style={{
              ...homeStyles.motelesGrid,
              paddingLeft: isMobile ? '20px' : '0',
              paddingRight: isMobile ? '20px' : '0',
            }}>
            {moteles.map((motel) => (
              <div 
                key={motel.id} 
                onClick={() => navigate(`/motel/${motel.id}`)}
                style={{
                  ...homeStyles.motelCard,
                  minWidth: isMobile ? 180 : 200,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.5)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(192, 132, 252, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {motel.cover_image && (
                  <div style={homeStyles.motelImage}>
                    <img
                      src={motel.cover_image}
                      alt={motel.nombre}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200x120/333/C084FC?text=Motel    ';
                      }}
                    />
                  </div>
                )}
                
                <h4 style={{
                  ...typography.subtitle,
                  color: '#E0E0FF',
                  margin: 0,
                  fontSize: isMobile ? '15px' : '16px',
                }}>
                  {motel.nombre}
                </h4>
                
                {motel.rating && (
                  <p style={{
                    color: '#FFD700',
                    margin: '8px 0',
                    fontSize: isMobile ? '13px' : '14px',
                    fontFamily: typography.fontFamilies.body,
                  }}>
                    ⭐ {parseFloat(motel.rating).toFixed(1)}
                  </p>
                )}
                
                {motel.municipio && (
                  <p style={{
                    color: '#9CA3AF',
                    fontSize: isMobile ? '11px' : '12px',
                    margin: '4px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: typography.fontFamilies.body,
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
                    padding: isMobile ? '6px 12px' : '8px 16px',
                    borderRadius: 8,
                    fontSize: isMobile ? '12px' : '13px',
                    cursor: 'pointer',
                    width: '100%',
                    fontFamily: typography.fontFamilies.button,
                    fontWeight: typography.weights.medium,
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#C084FC';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
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
            padding: isMobile ? 24 : 32,
            textAlign: 'center',
            border: '1px solid rgba(192, 132, 252, 0.2)',
            fontFamily: typography.fontFamilies.body,
            margin: isMobile ? '0 20px' : '0',
          }}>
            <p style={{ color: '#9CA3AF', fontSize: isMobile ? 15 : 16 }}>
              No hay moteles disponibles en este momento.
            </p>
          </div>
        )}

        {/* Cupones Destacados */}
        <h3 style={{
          ...typography.title,
          color: '#DDD6FE',
          marginBottom: 16,
          marginTop: isMobile ? 28 : 40,
          fontSize: isMobile ? '20px' : '22px',
          textAlign: 'center'
        }}>
          ¡Cupones Exclusivos para Ti!
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: isMobile ? 16 : 20,
          justifyContent: 'center',
          padding: isMobile ? '0 20px' : '0',
        }}>
          <div 
            onClick={handleVerCupones} // ✅ FUNCIÓN PROTEGIDA
            style={{
              ...homeStyles.couponCard,
              padding: isMobile ? 24 : 32,
              maxWidth: isMobile ? '100%' : 360,
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
              fontSize: isMobile ? 40 : 50,
              marginBottom: 16,
              opacity: 0.9
            }}>
              🎟️
            </div>
            <h2 style={{
              ...typography.title,
              margin: '0 0 16px',
              fontSize: isMobile ? '20px' : '22px',
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              Acceso Prioritario
            </h2>
            <p style={{
              ...typography.body,
              margin: '0 0 20px',
              fontSize: isMobile ? '14px' : '15px',
              lineHeight: 1.5,
              opacity: 0.95,
              color: 'white',
            }}>
              Descuentos exclusivos, experiencias únicas y ahorros reales en los mejores lugares.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVerCupones(); // ✅ FUNCIÓN PROTEGIDA
              }}
              style={{
                backgroundColor: 'white',
                color: '#7E22CE',
                border: 'none',
                padding: isMobile ? '10px 20px' : '12px 24px',
                borderRadius: 24,
                fontSize: isMobile ? '15px' : '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                width: '100%',
                fontFamily: typography.fontFamilies.button,
                fontWeight: typography.weights.semiBold,
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#F3E8FF';
                e.target.style.transform = 'scale(1.03)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.transform = 'scale(1)';
              }}
            >
              🎉 ¡Ver Cupones Disponibles!
            </button>
          </div>
        </div>

        <p style={{
          ...typography.small,
          textAlign: 'center',
          marginTop: isMobile ? 40 : 60,
          color: '#6B7280',
          paddingBottom: isMobile ? 20 : 40,
        }}>
          © {new Date().getFullYear()} LaClave. Todos los derechos reservados.
        </p>
      </div>

      {/* MODALES */}
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
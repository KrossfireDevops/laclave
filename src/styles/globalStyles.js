// src/styles/globalStyles.js
// ======================== PALETA DE COLORES ========================
export const colors = {
  primary: '#C084FC',           // Morado principal (LaClave)
  primaryHover: '#D8B4FE',
  secondary: '#A78BFA',
  neonPink: '#EC4899',
  success: '#10B981',
  warning: '#FCD34D',
  danger: '#EF4444',

  background: '#0a0a0a',        // Fondo ultra oscuro premium
  cardBg: 'rgba(30, 30, 40, 0.95)',
  sidebarBg: 'rgba(20, 20, 35, 0.95)',
  headerBg: 'rgba(15, 15, 27, 0.98)',

  text: '#E0E0FF',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',

  border: 'rgba(192, 132, 252, 0.2)',
  borderHover: 'rgba(192, 132, 252, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.9)',
};

// ======================== TIPOGRAFÍAS LA CLAVE ========================
export const typography = {
  // Fuentes principales
  fontFamilies: {
    logo: '"Playfair Display", serif',
    title: '"Montserrat", sans-serif',
    body: '"Inter", sans-serif',
    button: '"Montserrat", sans-serif',
  },

  // Pesos de fuente
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
  },

  // Estilos para el logo
  logo: {
    fontFamily: '"Playfair Display", serif',
    fontWeight: 700,
    fontSize: '32px',
    letterSpacing: '1px',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },

  // Estilos para títulos
  title: {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 600,
    fontSize: '20px',
    lineHeight: 1.3,
  },

  // Estilos para subtítulos
  subtitle: {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 500,
    fontSize: '16px',
    letterSpacing: '0.5px',
    lineHeight: 1.4,
  },

  // Estilos para texto del cuerpo
  body: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '1.5',
  },

  // Estilos para botones
  button: {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 600,
    fontSize: '16px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },

  // Estilos para texto pequeño
  small: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 400,
    fontSize: '12px',
    lineHeight: '1.4',
  },

  // Estilos para badges/etiquetas
  badge: {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 600,
    fontSize: '13px',
    letterSpacing: '0.3px',
  },
};

// ======================== ESTILOS GLOBALES REUTILIZABLES ========================
export const globalStyles = {
  // Tipografía base para la aplicación
  typographyBase: {
    fontFamily: typography.fontFamilies.body,
    fontWeight: typography.weights.regular,
    fontSize: '14px',
    lineHeight: '1.5',
    color: colors.text,
  },

  // Inputs
  input: {
    width: '100%',
    padding: '14px 18px',
    margin: '10px 0',
    border: `2px solid ${colors.border}`,
    borderRadius: '16px',
    backgroundColor: 'rgba(30, 30, 40, 0.9)',
    color: 'white',
    fontFamily: typography.fontFamilies.body,
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  },
  inputFocus: {
    borderColor: colors.primary,
    boxShadow: '0 0 0 3px rgba(192, 132, 252, 0.2)',
  },

  // Botones
  button: {
    padding: '14px 28px',
    backgroundColor: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontFamily: typography.fontFamilies.button,
    fontWeight: typography.weights.semiBold,
    fontSize: '16px',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 25px rgba(192, 132, 252, 0.4)',
  },
  buttonHover: {
    backgroundColor: colors.primaryHover,
    transform: 'translateY(-4px)',
    boxShadow: '0 15px 35px rgba(192, 132, 252, 0.5)',
  },
  buttonPink: {
    backgroundColor: colors.neonPink,
    padding: '12px 24px',
    borderRadius: '12px',
    color: 'white',
    border: 'none',
    fontFamily: typography.fontFamilies.button,
    fontWeight: typography.weights.semiBold,
    cursor: 'pointer',
  },
  buttonSmall: {
    padding: '8px 16px',
    borderRadius: '12px',
    fontFamily: typography.fontFamilies.button,
    fontWeight: typography.weights.semiBold,
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
  },

  // Tarjetas
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: '24px',
    overflow: 'hidden',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
    transition: 'all 0.4s ease',
  },
  cardHover: {
    transform: 'translateY(-12px)',
    borderColor: colors.primary,
  },

  // Badges
  badge: {
    padding: '8px 16px',
    borderRadius: '30px',
    fontFamily: typography.fontFamilies.title,
    fontSize: '13px',
    fontWeight: typography.weights.semiBold,
    color: 'white',
  },
  badgeActive: { backgroundColor: 'rgba(16, 185, 129, 0.95)' },
  badgeInactive: { backgroundColor: 'rgba(239, 68, 68, 0.95)' },
  badgeRooms: {
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    color: colors.primary,
    padding: '12px 20px',
    borderRadius: '16px',
    fontFamily: typography.fontFamilies.title,
    fontWeight: typography.weights.semiBold,
    fontSize: '15px',
  },

  // Modal
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: '24px',
    padding: '40px',
    border: `1px solid ${colors.border}`,
    maxHeight: '90vh',
    overflowY: 'auto',
    fontFamily: typography.fontFamilies.body,
  },

  // Spinner
  spinner: {
    width: '60px',
    height: '60px',
    border: '6px solid rgba(192, 132, 252, 0.2)',
    borderTop: '6px solid #C084FC',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  // Filtros
  filterButton: {
    padding: '10px 20px',
    border: `2px solid ${colors.primary}`,
    borderRadius: '30px',
    fontFamily: typography.fontFamilies.button,
    fontSize: '14px',
    fontWeight: typography.weights.semiBold,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.3s',
  },
  filterButtonHover: {
    backgroundColor: colors.primary,
    color: 'white',
  },

  // Headings
  h1: {
    ...typography.logo,
    fontSize: '32px',
    color: colors.primary,
  },
  h2: {
    fontFamily: typography.fontFamilies.title,
    fontWeight: typography.weights.semiBold,
    fontSize: '24px',
    color: colors.textLight,
  },
  h3: {
    fontFamily: typography.fontFamilies.title,
    fontWeight: typography.weights.semiBold,
    fontSize: '20px',
    color: colors.text,
  },
  h4: {
    fontFamily: typography.fontFamilies.title,
    fontWeight: typography.weights.medium,
    fontSize: '18px',
    color: colors.text,
  },
};

// ======================== ESTILOS DEL ADMIN DASHBOARD ========================
export const adminStyles = {
  adminContainer: { 
    backgroundColor: colors.background, 
    color: colors.text, 
    minHeight: '100vh', 
    fontFamily: typography.fontFamilies.body 
  },
  header: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    height: 64, 
    background: colors.headerBg, 
    backdropFilter: 'blur(12px)', 
    borderBottom: `1px solid ${colors.border}`, 
    zIndex: 1000, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: '0 24px' 
  },
  sidebar: { 
    width: 240, 
    background: colors.sidebarBg, 
    borderRight: `1px solid ${colors.border}`, 
    padding: '20px 0', 
    position: 'fixed', 
    height: 'calc(100vh - 64px)', 
    overflowY: 'auto',
    fontFamily: typography.fontFamilies.body,
  },
  mainContent: { 
    marginLeft: 240, 
    padding: 40, 
    width: 'calc(100% - 240px)',
    fontFamily: typography.fontFamilies.body,
  },
  statCard: { 
    background: colors.cardBg, 
    borderRadius: 20, 
    padding: 28, 
    border: `1px solid ${colors.border}`, 
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    fontFamily: typography.fontFamilies.body,
  },
  chartContainer: { 
    background: colors.cardBg, 
    borderRadius: 20, 
    padding: 24, 
    border: `1px solid ${colors.border}`,
    fontFamily: typography.fontFamilies.body,
  },
  listItem: { 
    background: 'rgba(30,30,40,0.7)', 
    padding: 16, 
    borderRadius: 12, 
    border: `1px solid ${colors.border}`, 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    fontFamily: typography.fontFamilies.body,
  },
  modalOverlay: { 
    position: 'fixed', 
    inset: 0, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 2000, 
    padding: 20 
  },
  modalContent: { 
    background: '#1a1a2e', 
    padding: 24, 
    borderRadius: 16, 
    width: '90%', 
    maxWidth: 500, 
    border: `1px solid ${colors.primary}`, 
    maxHeight: '90vh', 
    overflowY: 'auto',
    fontFamily: typography.fontFamilies.body,
  },
  flexBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  gap12: { display: 'flex', gap: 12 },
  mb24: { marginBottom: 24 },
  textCenter: { textAlign: 'center' },
};

// ======================== ESTILOS DEL PUBLIC HOME (HERO PREMIUM) ========================
export const homeStyles = {
  container: { 
    backgroundColor: colors.background, 
    minHeight: '100vh', 
    padding: 20, 
    color: colors.text, 
    fontFamily: typography.fontFamilies.body 
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24, 
    position: 'relative' 
  },
  logo: { 
    ...typography.logo,
    color: colors.primary, 
    fontSize: '32px', 
    margin: 0 
  },
  subtitle: { 
    ...typography.subtitle,
    textAlign: 'center', 
    margin: '8px 0 24px', 
    color: colors.secondary, 
    fontSize: '16px' 
  },

  // Hero Banner Premium (Booking/Expedia style 2025)
  bannerContainer: {
    width: '100%',
    height: typeof window !== 'undefined' && window.innerWidth < 900 ? 250 : 400,
    marginBottom: 28,
    borderRadius: 12,
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    position: 'relative',
    margin: '0 auto',
  },
  bannerImage: { 
    width: '100%', 
    height: '100%', 
    objectFit: 'cover', 
    objectPosition: 'center top', 
    display: 'block' 
  },
  bannerOverlay: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(15, 15, 27, 0.75)',
    backdropFilter: 'blur(12px)',
    color: 'white',
    padding: '16px 32px',
    borderRadius: 12,
    textAlign: 'center',
    maxWidth: '90%',
    border: `2px solid rgba(192, 132, 252, 0.3)`,
    fontFamily: typography.fontFamilies.body,
  },
  bannerTitle: { 
    fontFamily: typography.fontFamilies.title,
    fontWeight: typography.weights.semiBold,
    margin: '0 0 12px', 
    fontSize: 'clamp(20px, 5vw, 32px)', 
    textShadow: '0 2px 8px rgba(0,0,0,0.6)' 
  },
  bannerCta: {
    background: 'linear-gradient(135deg, #C084FC, #A855F7)',
    color: 'white',
    border: 'none',
    padding: '12px 28px',
    borderRadius: 30,
    fontFamily: typography.fontFamilies.button,
    fontWeight: typography.weights.semiBold,
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 6px 20px rgba(192, 132, 252, 0.4)',
  },
  bannerDots: { 
    position: 'absolute', 
    bottom: 16, 
    left: 0, 
    right: 0, 
    display: 'flex', 
    justifyContent: 'center', 
    gap: 8 
  },
  bannerDot: (active) => ({
    width: active ? 20 : 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: active ? colors.primary : 'rgba(192, 132, 252, 0.5)',
    transition: 'all 0.4s ease',
    cursor: 'pointer',
  }),

  sectionTitle: { 
    ...typography.title,
    color: '#DDD6FE', 
    margin: '32px 0 16px', 
    fontSize: '22px' 
  },

  motelesGrid: { 
    display: 'flex', 
    gap: 16, 
    overflowX: 'auto', 
    paddingBottom: 16, 
    scrollbarWidth: 'none', 
    msOverflowStyle: 'none' 
  },
  motelCard: { 
    minWidth: 200, 
    backgroundColor: 'rgba(30, 30, 40, 0.7)', 
    borderRadius: 12, 
    padding: 16, 
    flexShrink: 0, 
    border: `1px solid ${colors.border}`, 
    transition: 'all 0.3s ease', 
    cursor: 'pointer',
    fontFamily: typography.fontFamilies.body,
  },
  motelCardHover: { 
    transform: 'translateY(-6px)', 
    borderColor: colors.primary, 
    boxShadow: '0 12px 30px rgba(192, 132, 252, 0.15)' 
  },
  motelImage: { 
    width: '100%', 
    height: 120, 
    borderRadius: 8, 
    overflow: 'hidden', 
    marginBottom: 12, 
    backgroundColor: '#1F2937' 
  },

  couponCard: {
    background: 'linear-gradient(135deg, #C084FC 0%, #A855F7 100%)',
    borderRadius: 20,
    padding: 32,
    cursor: 'pointer',
    transition: 'all 0.4s ease',
    boxShadow: '0 15px 40px rgba(192, 132, 252, 0.35)',
    color: 'white',
    textAlign: 'center',
    maxWidth: 360,
    margin: '0 auto',
    fontFamily: typography.fontFamilies.body,
  },
  couponCardHover: { 
    transform: 'translateY(-12px)', 
    boxShadow: '0 20px 50px rgba(192, 132, 252, 0.5)' 
  },

  footer: { 
    ...typography.small,
    textAlign: 'center', 
    marginTop: 60, 
    color: '#6B7280', 
    padding: '20px 0' 
  },
};

// ======================== ANIMACIONES GLOBALES ========================
export const globalKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.7); }
    50% { box-shadow: 0 0 35px rgba(16, 185, 129, 1); }
  }
`;

// ======================== CDN PARA TIPOGRAFÍAS ========================
export const typographyCDN = `
  <!-- Agrega esto en tu index.html -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
`;

// ======================== FUNCIÓN DE AYUDA PARA TIPOGRAFÍAS ========================
export const getTypographyStyle = (type, customProps = {}) => {
  const baseStyles = {
    logo: typography.logo,
    title: typography.title,
    subtitle: typography.subtitle,
    body: typography.body,
    button: typography.button,
    small: typography.small,
    badge: typography.badge,
  };

  return { ...baseStyles[type] || typography.body, ...customProps };
};
// === USO RECOMENDADO EN TU AdminDashboard ===
// Ejemplo de cómo aplicar:
// <button style={globalStyles.button} onMouseEnter={e => e.currentTarget.style = {...globalStyles.button, ...globalStyles.buttonHover}}>
// <div style={globalStyles.card} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-12px)'}>

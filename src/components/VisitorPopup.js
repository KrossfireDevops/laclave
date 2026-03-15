// src/components/VisitorPopup.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { globalStyles, colors } from '../styles/globalStyles';

export default function VisitorPopup({ isOpen, onClose, onRegister, onLogin }) {
  const { currentUser } = useAuth();

  // Si el usuario ya está autenticado, no mostrar el popup
  if (currentUser || !isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: 20,
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 32,
        maxWidth: 500,
        width: '100%',
        border: '1px solid rgba(192, 132, 252, 0.4)',
        color: '#E0E0FF',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        animation: 'slideInUp 0.4s ease-out'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: '#9CA3AF',
            fontSize: 24,
            cursor: 'pointer',
            fontWeight: 'bold',
            padding: 0,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#C084FC'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
        >
          ✕
        </button>

        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(192,132,252,0.2), rgba(236,72,153,0.2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          border: '2px solid rgba(192, 132, 252, 0.3)',
          boxShadow: '0 0 20px rgba(192, 132, 252, 0.2)'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
        </div>

        <h2 style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#F3F4F6',
          margin: '0 0 16px'
        }}>
          🔐 Acceso Restringido
        </h2>

        <p style={{
          fontSize: 16,
          color: '#C4B5FD',
          marginBottom: 24,
          lineHeight: 1.6
        }}>
          Regístrate en La Clave, para acceder a nuestros beneficios y promociones
        </p>

        <div style={{
          background: 'rgba(192, 132, 252, 0.1)',
          border: '1px solid rgba(192, 132, 252, 0.3)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 24
        }}>
          <p style={{
            fontSize: 14,
            color: '#94A3B8',
            margin: 0,
            lineHeight: 1.5
          }}>
            <strong style={{ color: '#C084FC' }}>✨ Beneficios:</strong><br />
            • Cupones exclusivos con descuentos<br />
            • Promociones especiales<br />
            • Canje rápido y seguro<br />
            • Historial de compras
          </p>
        </div>

        <button
          onClick={onRegister}
          style={{
            ...globalStyles.button,
            width: '100%',
            padding: '16px 24px',
            backgroundColor: '#C084FC',
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold',
            borderRadius: 12,
            marginBottom: 12,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 6px 20px rgba(192, 132, 252, 0.4)',
            border: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#D8B4FE';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(192, 132, 252, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#C084FC';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(192, 132, 252, 0.4)';
          }}
        >
          📝 Regístrate Ahora
        </button>

        <p style={{
          fontSize: 13,
          color: '#94A3B8',
          margin: '12px 0 0'
        }}>
          ¿Ya tienes cuenta?{' '}
          <button
            onClick={() => {
              onClose(); // Cierra el VisitorPopup
              if (onLogin) {
                onLogin(); // Llama a la función onLogin para abrir el LoginModal
              }
            }}
            style={{
              color: '#C084FC',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              textDecoration: 'underline',
              fontSize: 13,
              padding: 0,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#E9D5FF'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#C084FC'}
          >
            Inicia sesión
          </button>
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
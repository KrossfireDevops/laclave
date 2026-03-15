// src/components/LoginModal.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { globalStyles } from '../styles/globalStyles';

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signInWithEmail(email, password);
    if (error) {
      setError('🔐 El correo o la contraseña no coinciden. ¿Olvidaste tu contraseña?');
    } else {
      onClose();
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await signInWithGoogle();
    if (error) {
      setError('🧩 No pudimos conectarte con tu cuenta de Google. Por favor, inténtalo de nuevo.');
    } else {
      onClose();
    }
    setLoading(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <style>{`
        .login-modal-content::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001,
          padding: '20px 16px'
        }}
        onClick={handleBackdropClick}
      >
        <div
          className="login-modal-content"
          style={{
            backgroundColor: 'rgba(20, 20, 30, 0.9)',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90vh',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            border: '1px solid rgba(192, 132, 252, 0.2)',
            position: 'relative',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              fontSize: 16,
              cursor: 'pointer',
              fontWeight: 'bold',
              padding: 0
            }}
          >
            ✕
          </button>

          <h2 style={{ 
            color: '#C084FC', 
            textAlign: 'center', 
            marginBottom: 8, 
            fontSize: 22
          }}>
            🔑 Bienvenido a LaClave
          </h2>
          <p style={{ 
            textAlign: 'center', 
            color: '#9CA3AF', 
            marginBottom: 20, 
            fontSize: 14 
          }}>
            Inicia sesión para acceder a tus cupones.
          </p>

          {error && (
            <div style={{
              backgroundColor: 'rgba(192, 132, 252, 0.15)',
              border: '1px solid #C084FC',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16
            }}>
              <p style={{ color: '#E0D6FF', margin: 0, fontSize: 14 }}>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleEmailLogin} style={{ width: '100%' }}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                ...globalStyles.input,
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 16px',
                fontSize: 15,
                borderRadius: 8,
                border: '1px solid rgba(156, 163, 175, 0.4)',
                backgroundColor: 'rgba(15, 15, 23, 0.7)',
                color: '#E2E8F0',
                marginBottom: 12
              }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                ...globalStyles.input,
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 16px',
                fontSize: 15,
                borderRadius: 8,
                border: '1px solid rgba(156, 163, 175, 0.4)',
                backgroundColor: 'rgba(15, 15, 23, 0.7)',
                color: '#E2E8F0',
                marginBottom: 12
              }}
            />

            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/forgot-password');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#C084FC',
                  fontSize: 13,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  fontWeight: '600'
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 20px',
                fontSize: 16,
                fontWeight: 'bold',
                backgroundColor: loading ? '#6B7280' : '#EC4899',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: 16
              }}
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            margin: '20px 0' 
          }}>
            <div style={{ 
              flex: 1, 
              height: 1, 
              backgroundColor: 'rgba(156, 163, 175, 0.3)' 
            }} />
            <span style={{ 
              color: '#9CA3AF', 
              padding: '0 12px', 
              fontSize: 14 
            }}>
              o
            </span>
            <div style={{ 
              flex: 1, 
              height: 1, 
              backgroundColor: 'rgba(156, 163, 175, 0.3)' 
            }} />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#FFFFFF',
              color: '#1F2937',
              border: '1px solid rgba(156, 163, 175, 0.3)',
              borderRadius: 8,
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              fontSize: 15,
              transition: 'all 0.2s',
              opacity: loading ? 0.6 : 1
            }}
            onMouseOver={(e) => {
              if (!loading) e.target.style.backgroundColor = '#F3F4F6';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#FFFFFF';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            {loading ? 'Cargando...' : 'Continuar con Google'}
          </button>

          <p style={{ 
            textAlign: 'center', 
            marginTop: 20, 
            color: '#9CA3AF', 
            fontSize: 14 
          }}>
            ¿No tienes cuenta?{' '}
            <button
              onClick={() => {
                onClose();
                if (onSwitchToRegister) onSwitchToRegister();
              }}
              style={{
                color: '#C084FC',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                textDecoration: 'underline',
                fontSize: 14
              }}
            >
              Regístrate aquí
            </button>
          </p>

          <p style={{ 
            textAlign: 'center', 
            marginTop: 12, 
            color: '#9CA3AF', 
            fontSize: 14 
          }}>
            <button
              onClick={() => {
                onClose();
                navigate('/');
              }}
              style={{
                color: '#9CA3AF',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 14,
                textDecoration: 'underline'
              }}
            >
              Volver al inicio
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
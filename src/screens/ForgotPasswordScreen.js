// src/screens/ForgotPasswordScreen.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { globalStyles } from '../styles/globalStyles';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Error al enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        backgroundColor: '#0F0F1B',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <div style={{
          backgroundColor: 'rgba(20, 20, 30, 0.9)',
          borderRadius: 16,
          padding: 32,
          maxWidth: 400,
          textAlign: 'center',
          border: '1px solid rgba(192, 132, 252, 0.2)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h2 style={{ color: '#C084FC', marginBottom: 12, fontSize: 22 }}>
            ¡Correo Enviado!
          </h2>
          <p style={{ color: '#A78BFA', marginBottom: 24, fontSize: 15, lineHeight: 1.6 }}>
            Te enviamos un enlace de recuperación a <strong>{email}</strong>
          </p>
          <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 24 }}>
            Revisa tu bandeja de entrada y sigue las instrucciones.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              ...globalStyles.button,
              backgroundColor: '#C084FC',
              width: '100%'
            }}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#0F0F1B',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    }}>
      <div style={{
        backgroundColor: 'rgba(20, 20, 30, 0.9)',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        border: '1px solid rgba(192, 132, 252, 0.2)',
        position: 'relative'
      }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            color: '#9CA3AF',
            fontSize: 14,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ✕
        </button>

        <h2 style={{ color: '#C084FC', textAlign: 'center', marginBottom: 8, fontSize: 24 }}>
          🔑 Recuperar Contraseña
        </h2>
        <p style={{ textAlign: 'center', color: '#9CA3AF', marginBottom: 24, fontSize: 14 }}>
          Ingresa tu correo y te enviaremos un enlace de recuperación.
        </p>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #EF4444',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16
          }}>
            <p style={{ color: '#F87171', margin: 0, fontSize: 14 }}>
              ❌ {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={globalStyles.input}
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              ...globalStyles.button,
              backgroundColor: loading ? '#6B7280' : '#EC4899',
              marginTop: 8
            }}
          >
            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: '#9CA3AF', fontSize: 14 }}>
          ¿Recordaste tu contraseña?{' '}
          <button
            onClick={() => navigate('/login')}
            style={{
              color: '#C084FC',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              textDecoration: 'underline'
            }}
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
}
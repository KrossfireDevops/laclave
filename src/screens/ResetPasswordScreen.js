// src/screens/ResetPasswordScreen.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { globalStyles } from '../styles/globalStyles';

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay un token válido en la URL
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidToken(true);
      } else {
        setError('El enlace de recuperación es inválido o ha expirado.');
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      return setError('Las contraseñas no coinciden.');
    }

    if (newPassword.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Error al actualizar la contraseña.');
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#C084FC', marginBottom: 12, fontSize: 22 }}>
            ¡Contraseña Actualizada!
          </h2>
          <p style={{ color: '#A78BFA', marginBottom: 24, fontSize: 15 }}>
            Tu contraseña ha sido cambiada exitosamente.
          </p>
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>
            Redirigiendo al inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  if (!validToken) {
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
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#F87171', marginBottom: 12, fontSize: 22 }}>
            Enlace Inválido
          </h2>
          <p style={{ color: '#9CA3AF', marginBottom: 24, fontSize: 15 }}>
            {error || 'El enlace de recuperación ha expirado o es inválido.'}
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            style={{
              ...globalStyles.button,
              backgroundColor: '#EF4444',
              width: '100%'
            }}
          >
            Solicitar nuevo enlace
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
        border: '1px solid rgba(192, 132, 252, 0.2)'
      }}>
        <h2 style={{ color: '#C084FC', textAlign: 'center', marginBottom: 8, fontSize: 24 }}>
          🔐 Nueva Contraseña
        </h2>
        <p style={{ textAlign: 'center', color: '#9CA3AF', marginBottom: 24, fontSize: 14 }}>
          Ingresa tu nueva contraseña.
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
            type="password"
            placeholder="Nueva contraseña (mín. 6 caracteres)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={globalStyles.input}
            required
          />

          <input
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
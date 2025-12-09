// src/components/RegisterModal.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { globalStyles, colors } from '../styles/globalStyles';

export default function RegisterModal({ isOpen, onClose }) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [genero, setGenero] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [alias, setAlias] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Bloquear scroll del fondo cuando el modal está abierto
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

  const validateAge = (birthdate) => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateAge(fechaNacimiento)) {
      setError('Es Necesario Contar con la mayoría de edad para tener acceso a esta plataforma');
      setLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError('Debes aceptar los Términos y Condiciones para registrarte.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            apellido,
            telefono,
            genero,
            fecha_nacimiento: fechaNacimiento,
            alias
          }
        }
      });

      if (authError) throw authError;

      if (data.user) {
        const { error: dbError } = await supabase.from('usuarios').insert({
          id: data.user.id,
          email,
          nombre,
          apellido,
          alias,
          telefono,
          genero,
          fecha_nacimiento: fechaNacimiento,
          rol: 'cliente',
          marketing_consent: acceptMarketing
        });

        if (dbError) {
          console.error('Error al crear perfil:', dbError);
          setError('Error al crear tu perfil. Intenta de nuevo.');
        } else {
          alert('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.');
          onClose();
        }
      }
    } catch (err) {
      console.error('Error en registro:', err);
      setError('Error al crear la cuenta. El correo podría estar en uso.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    ...globalStyles.input,
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 16px',
    fontSize: '14px',
    marginBottom: '10px',
    backgroundColor: 'rgba(30, 30, 40, 0.9)',
    color: '#E2E8F0',
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* ✅ Estilos para ocultar scrollbar en Webkit (Chrome, Safari) */}
      <style>{`
        .register-modal-viewport::-webkit-scrollbar {
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
        {/* ✅ Contenedor con scroll interno y sin barra visible */}
        <div
          className="register-modal-viewport"
          style={{
            backgroundColor: 'rgba(20, 20, 30, 0.97)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90vh',
            overflowY: 'auto',
            /* Ocultar scrollbar en Firefox y IE/Edge */
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            border: '1px solid rgba(192, 132, 252, 0.3)',
            position: 'relative',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
            padding: '24px 20px',
            boxSizing: 'border-box'
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
              color: '#A78BFA',
              fontSize: 18,
              cursor: 'pointer',
              fontWeight: 'bold',
              padding: 0,
              zIndex: 10
            }}
          >
            ✕
          </button>

          <h2 style={{ 
            color: colors.primary, 
            textAlign: 'center', 
            marginBottom: 12, 
            fontSize: 22 
          }}>
            🗝️ Regístrate
          </h2>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              borderRadius: 8,
              padding: 12,
              marginBottom: 14,
              fontSize: 13
            }}>
              <p style={{ color: '#F87171', margin: 0 }}>
                ❌ {error}
              </p>
            </div>
          )}

          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Nombre(s)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="text"
              placeholder="Apellido(s)"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="password"
              placeholder="Contraseña (mín. 6)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
              minLength={6}
            />
            <input
              type="tel"
              placeholder="Teléfono (opcional)"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              style={inputStyle}
            />
            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              style={{
                ...inputStyle,
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
              required
            />
            <input
              type="text"
              placeholder="Alias (nombre público)"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              style={inputStyle}
              required
            />
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              style={{
                ...inputStyle,
                appearance: 'none',
                WebkitAppearance: 'none',
                backgroundImage: `url("image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23C084FC' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '12px',
                paddingRight: '36px'
              }}
              required
            >
              <option value="">Género</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="X">Prefiero no decirlo</option>
            </select>

            {/* Términos y marketing */}
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                style={{ marginTop: 4, accentColor: colors.primary }}
                required
              />
              <label htmlFor="terms" style={{ fontSize: 12, color: '#C7D2FE', lineHeight: 1.4 }}>
                Acepto los{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open('https://laclave.com.mx/terminos', '_blank');
                  }}
                  style={{
                    color: colors.primary,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    padding: 0,
                    fontSize: 12
                  }}
                >
                  Términos
                </button>{' '}
                de uso. *
              </label>
            </div>

            <div style={{ marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input
                type="checkbox"
                id="marketing"
                checked={acceptMarketing}
                onChange={(e) => setAcceptMarketing(e.target.checked)}
                style={{ marginTop: 4, accentColor: colors.primary }}
              />
              <label htmlFor="marketing" style={{ fontSize: 12, color: '#A78BFA', lineHeight: 1.4 }}>
                Aceptar promociones por correo.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: loading ? '#6B7280' : colors.neonPink,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 16
              }}
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>

          <p style={{ 
            textAlign: 'center', 
            marginTop: 16, 
            color: colors.textMuted,
            fontSize: 13
          }}>
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => {
                onClose();
                // Puedes abrir un LoginModal aquí si lo implementas
              }}
              style={{
                color: colors.primary,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 13,
                textDecoration: 'underline'
              }}
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
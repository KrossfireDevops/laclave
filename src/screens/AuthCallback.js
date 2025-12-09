// src/screens/AuthCallback.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Verificando tu cuenta...');

  useEffect(() => {
    const type = searchParams.get('type');

    // Mostrar mensaje si es confirmación de registro
    if (type === 'signup') {
      setMessage('¡Bienvenido a LaClave! 🗝️\nTu correo ha sido confirmado. Ahora puedes acceder a tus cupones y ofertas exclusivas.');
    }

    // Supabase ya procesó el token en segundo plano
    // Aquí solo validamos que haya sesión y redirigimos
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate('/login');
        return;
      }

      // Si es signup, damos tiempo para ver el mensaje
      if (type === 'signup') {
        setTimeout(() => navigate('/'), 4000);
      } else {
        navigate('/');
      }
    };

    checkSession();
  }, [navigate, searchParams]);

  return (
    <div style={{
      backgroundColor: '#0F0F1B',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#E0E0FF',
      textAlign: 'center',
      padding: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: 500 }}>
        <h2 style={{ 
          color: '#C084FC', 
          fontSize: 24, 
          marginBottom: 16,
          fontWeight: 'bold'
        }}>
          {message.split('\n')[0]}
        </h2>
        {message.split('\n')[1] && (
          <p style={{ 
            fontSize: 16, 
            color: '#A78BFA',
            lineHeight: 1.6
          }}>
            {message.split('\n')[1]}
          </p>
        )}

        <div style={{
          width: 48,
          height: 48,
          border: '4px solid rgba(192, 132, 252, 0.3)',
          borderTop: '4px solid #C084FC',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '24px auto'
        }} />
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
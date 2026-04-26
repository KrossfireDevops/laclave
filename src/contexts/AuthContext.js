// src/contexts/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null); // ✅ NUEVO

  useEffect(() => {
    let isSubscribed = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isSubscribed) return;

        if (error) {
          console.error('Error al obtener sesión:', error);
          setCurrentUser(null);
          setRole(null);
          setAccessToken(null); // ✅
          setLoading(false);
          return;
        }

        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('usuarios')
            .select('rol, nombre, alias')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!isSubscribed) return;

          if (profileError) {
            console.warn('No se pudo cargar el perfil:', profileError);
          }

          const enrichedUser = {
            ...session.user,
            rol: profile?.rol || 'cliente',
            nombre: profile?.nombre || null,
            alias: profile?.alias || null,
          };

          setCurrentUser(enrichedUser);
          setRole(profile?.rol || 'cliente');
          setAccessToken(session.access_token); // ✅
              } else {
              setCurrentUser(null);
              setRole(null);
              setAccessToken(null);

              // ✅ Redirigir al Home cuando la sesión se cierra
              // Evitar redirigir si ya está en el Home o en páginas públicas
              const rutasPublicas = ['/', '/auth/callback', '/forgot-password', '/reset-password'];
              if (!rutasPublicas.includes(window.location.pathname)) {
                window.location.href = '/';
              }
            }
      } catch (err) {
        console.error('Excepción en initializeAuth:', err);
        if (isSubscribed) {
          setCurrentUser(null);
          setRole(null);
          setAccessToken(null); // ✅
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isSubscribed) return;

        try {
          if (session?.user) {
            const { data: profile, error: profileError } = await supabase
              .from('usuarios')
              .select('rol, nombre, alias')
              .eq('id', session.user.id)
              .maybeSingle();

            if (!isSubscribed) return;

            if (profileError) {
              console.warn('No se pudo cargar el perfil en cambio de auth:', profileError);
            }

            const enrichedUser = {
              ...session.user,
              rol: profile?.rol || 'cliente',
              nombre: profile?.nombre || null,
              alias: profile?.alias || null,
            };

            setCurrentUser(enrichedUser);
            setRole(profile?.rol || 'cliente');
            setAccessToken(session.access_token); // ✅
          } else {
            setCurrentUser(null);
            setRole(null);
            setAccessToken(null); // ✅
          }
        } catch (err) {
          console.error('Error en onAuthStateChange:', err);
          if (isSubscribed) {
            setCurrentUser(null);
            setRole(null);
            setAccessToken(null); // ✅
          }
        }
      }
    );

    return () => {
      isSubscribed = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = () => {
    const isLocal = window.location.hostname === 'localhost';
    const options = isLocal 
      ? {} 
      : { redirectTo: `${window.location.origin}/auth/callback` };
    
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options
    });
  };

  const signInWithEmail = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = () => supabase.auth.signOut();

  const value = {
    currentUser,
    role,
    loading,
    accessToken,  // ✅ NUEVO - disponible en toda la app
    signInWithGoogle,
    signInWithEmail,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
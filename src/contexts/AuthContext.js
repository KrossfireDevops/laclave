// src/contexts/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Intentar cargar perfil
        const { data: profile } = await supabase
          .from('usuarios')
          .select('rol, nombre, alias')
          .eq('id', session.user.id)
          .maybeSingle();

        const enrichedUser = {
          ...session.user,
          rol: profile?.rol || 'cliente',
          nombre: profile?.nombre || null,
          alias: profile?.alias || null,
        };

        setCurrentUser(enrichedUser);
        setRole(profile?.rol || 'cliente');
      } else {
        setCurrentUser(null);
        setRole(null);
      }
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('usuarios')
            .select('rol, nombre, alias')
            .eq('id', session.user.id)
            .maybeSingle();

          const enrichedUser = {
            ...session.user,
            rol: profile?.rol || 'cliente',
            nombre: profile?.nombre || null,
            alias: profile?.alias || null,
          };

          setCurrentUser(enrichedUser);
          setRole(profile?.rol || 'cliente');
        } else {
          setCurrentUser(null);
          setRole(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    role,
    loading,
    signInWithGoogle: () => {
      return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    },
    signInWithEmail: (email, password) => {
      return supabase.auth.signInWithPassword({ email, password });
    },
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
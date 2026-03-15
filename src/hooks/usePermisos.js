// src/hooks/usePermisos.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personalizado para verificar permisos del usuario actual
 * Uso: const { tienePermiso, loading } = usePermisos();
 *      if (tienePermiso('habitaciones:update_own')) { ... }
 */
export function usePermisos() {
  const { currentUser } = useAuth();
  const [permisosUsuario, setPermisosUsuario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarPermisos = useCallback(async () => {
    if (!currentUser?.id) {
      setPermisosUsuario([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener permisos del usuario a través de sus roles
      const { data, error: err } = await supabase.rpc('tiene_permiso', {
        p_usuario_id: currentUser.id,
        p_codigo_permiso: '' // Pasamos vacío para obtener todos
      });

      if (err) {
        console.error('Error al cargar permisos:', err);
        setError(err);
        setPermisosUsuario([]);
      } else {
        // La función tiene_permiso devuelve BOOLEAN, así que cargamos desde rol_permisos
        const { data: permisosData, error: permisosError } = await supabase
          .from('vista_permisos_por_rol')
          .select('permiso_codigo')
          .in(
            'rol_nombre',
            supabase.from('usuario_roles')
              .select('rol_id')
              .eq('usuario_id', currentUser.id)
          );

        if (permisosError) {
          console.error('Error al cargar permisos detallados:', permisosError);
          setError(permisosError);
          setPermisosUsuario([]);
        } else {
          const codigos = permisosData.map(p => p.permiso_codigo);
          setPermisosUsuario(codigos);
        }
      }
    } catch (err) {
      console.error('Error inesperado al cargar permisos:', err);
      setError(err);
      setPermisosUsuario([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    cargarPermisos();
  }, [cargarPermisos]);

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string} codigoPermiso - Código del permiso (ej: 'habitaciones:update_own')
   * @returns {boolean} - true si tiene el permiso, false si no
   */
  const tienePermiso = useCallback((codigoPermiso) => {
    if (loading) return false;
    return permisosUsuario.includes(codigoPermiso);
  }, [permisosUsuario, loading]);

  /**
   * Verifica si el usuario tiene AL MENOS UNO de los permisos dados
   * @param {string[]} codigosPermisos - Array de códigos de permisos
   * @returns {boolean} - true si tiene al menos uno
   */
  const tieneAlgunPermiso = useCallback((codigosPermisos) => {
    if (loading) return false;
    return codigosPermisos.some(codigo => permisosUsuario.includes(codigo));
  }, [permisosUsuario, loading]);

  /**
   * Verifica si el usuario tiene TODOS los permisos dados
   * @param {string[]} codigosPermisos - Array de códigos de permisos
   * @returns {boolean} - true si tiene todos
   */
  const tieneTodosPermisos = useCallback((codigosPermisos) => {
    if (loading) return false;
    return codigosPermisos.every(codigo => permisosUsuario.includes(codigo));
  }, [permisosUsuario, loading]);

  return {
    tienePermiso,
    tieneAlgunPermiso,
    tieneTodosPermisos,
    permisos: permisosUsuario,
    loading,
    error,
    refetch: cargarPermisos
  };
}

/**
 * Hook para verificar si usuario puede acceder a un establecimiento
 * @param {string} establecimientoId - ID del establecimiento
 * @returns {object} - { puedeEditar, puedeCrearCupones, puedeAprobarCanjes, loading }
 */
export function useAccesoEstablecimiento(establecimientoId) {
  const { currentUser } = useAuth();
  const [acceso, setAcceso] = useState({
    puedeEditar: false,
    puedeCrearCupones: false,
    puedeAprobarCanjes: false
  });
  const [loading, setLoading] = useState(true);

  const cargarAcceso = useCallback(async () => {
    if (!currentUser?.id || !establecimientoId) {
      setAcceso({ puedeEditar: false, puedeCrearCupones: false, puedeAprobarCanjes: false });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuario_establecimientos')
        .select('puede_editar, puede_crear_cupones, puede_aprobar_canjes')
        .eq('usuario_id', currentUser.id)
        .eq('establecimiento_id', establecimientoId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No encontrado
          setAcceso({ puedeEditar: false, puedeCrearCupones: false, puedeAprobarCanjes: false });
        } else {
          console.error('Error al cargar acceso:', error);
          setAcceso({ puedeEditar: false, puedeCrearCupones: false, puedeAprobarCanjes: false });
        }
      } else {
        setAcceso({
          puedeEditar: data.puede_editar || false,
          puedeCrearCupones: data.puede_crear_cupones || false,
          puedeAprobarCanjes: data.puede_aprobar_canjes || false
        });
      }
    } catch (err) {
      console.error('Error inesperado al cargar acceso:', err);
      setAcceso({ puedeEditar: false, puedeCrearCupones: false, puedeAprobarCanjes: false });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, establecimientoId]);

  useEffect(() => {
    cargarAcceso();
  }, [cargarAcceso]);

  return { ...acceso, loading };
}
// src/screens/AdminRolesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { colors, globalStyles } from '../styles/globalStyles';

// ===== ICONOS =====
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const KeyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path><path d="M12 9v4"></path>
  </svg>
);

const BuildingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

// ===== ESTILOS =====
const adminStyles = {
  container: {
    backgroundColor: '#0F0F1B',
    minHeight: '100vh',
    color: '#E0E0FF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(15, 15, 27, 0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(192, 132, 252, 0.2)',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    margin: 0
  },
  tabs: {
    display: 'flex',
    gap: 16,
    marginBottom: 24,
    padding: '0 24px',
    borderBottom: '2px solid rgba(192, 132, 252, 0.2)'
  },
  tabButton: {
    padding: '12px 24px',
    border: 'none',
    background: 'none',
    fontSize: 16,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderBottom: '3px solid transparent'
  },
  card: {
    background: 'rgba(30, 30, 45, 0.8)',
    borderRadius: 16,
    padding: 24,
    margin: '0 24px 24px',
    border: '1px solid rgba(192, 132, 252, 0.2)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1px solid rgba(192, 132, 252, 0.15)'
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F3F4F6',
    margin: 0
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#A78BFA',
    borderBottom: '2px solid rgba(192, 132, 252, 0.2)'
  },
  td: {
    padding: '16px',
    fontSize: 15,
    borderBottom: '1px solid rgba(156, 163, 175, 0.15)'
  },
  badge: {
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 'bold',
    display: 'inline-block'
  },
  actionButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginRight: 8
  },
  modalOverlay: {
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
    padding: 20
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 32,
    maxWidth: 600,
    width: '100%',
    border: '1px solid rgba(192, 132, 252, 0.4)',
    color: '#E0E0FF',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F3F4F6',
    margin: '0 0 24px',
    paddingBottom: 16,
    borderBottom: '1px solid rgba(192, 132, 252, 0.2)'
  },
  formGroup: {
    marginBottom: 20
  },
  formLabel: {
    display: 'block',
    fontSize: 14,
    fontWeight: '600',
    color: '#C4B5FD',
    marginBottom: 8
  },
  formInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid rgba(192, 132, 252, 0.3)',
    backgroundColor: 'rgba(30, 30, 40, 0.9)',
    color: 'white',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: 8,
    border: '1px solid rgba(192, 132, 252, 0.15)',
    background: 'rgba(30, 30, 45, 0.6)'
  },
  checkbox: {
    marginRight: 12,
    width: 18,
    height: 18,
    cursor: 'pointer'
  },
  modalFooter: {
    display: 'flex',
    gap: 12,
    marginTop: 24,
    paddingTop: 20,
    borderTop: '1px solid rgba(192, 132, 252, 0.2)'
  },
  modalButton: {
    flex: 1,
    padding: '14px 20px',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

// ===== COMPONENTE: LISTA DE ROLES =====
function ListaRoles({ roles, onEditRol, onAsignarPermisos, onAsignarUsuarios }) {
  return (
    <div style={adminStyles.card}>
      <div style={adminStyles.cardHeader}>
        <h2 style={adminStyles.cardTitle}>🎭 Roles del Sistema</h2>
        <button
          onClick={() => onEditRol(null)}
          style={{
            ...adminStyles.actionButton,
            backgroundColor: '#10B981',
            color: 'white'
          }}
        >
          <PlusIcon /> Nuevo Rol
        </button>
      </div>

      <table style={adminStyles.table}>
        <thead>
          <tr>
            <th style={adminStyles.th}>Rol</th>
            <th style={adminStyles.th}>Usuarios</th>
            <th style={adminStyles.th}>Permisos</th>
            <th style={adminStyles.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {roles.map(rol => (
            <tr key={rol.id}>
              <td style={adminStyles.td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: rol.color || '#6B7280',
                    display: 'inline-block'
                  }} />
                  <strong style={{ color: '#F3F4F6' }}>{rol.nombre}</strong>
                  {rol.is_system && (
                    <span style={{
                      ...adminStyles.badge,
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      color: '#F87171',
                      fontSize: 11
                    }}>
                      Sistema
                    </span>
                  )}
                </div>
                {rol.descripcion && (
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9CA3AF' }}>
                    {rol.descripcion}
                  </p>
                )}
              </td>
              <td style={adminStyles.td}>
                <button
                  onClick={() => onAsignarUsuarios(rol)}
                  style={{
                    ...adminStyles.actionButton,
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#60A5FA',
                    fontSize: 13
                  }}
                >
                  <UsersIcon /> Asignar Usuarios
                </button>
              </td>
              <td style={adminStyles.td}>
                <button
                  onClick={() => onAsignarPermisos(rol)}
                  style={{
                    ...adminStyles.actionButton,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34D399',
                    fontSize: 13
                  }}
                >
                  <KeyIcon /> Gestionar Permisos
                </button>
              </td>
              <td style={adminStyles.td}>
                {!rol.is_system && (
                  <button
                    onClick={() => onEditRol(rol)}
                    style={{
                      ...adminStyles.actionButton,
                      backgroundColor: 'rgba(192, 132, 252, 0.15)',
                      color: '#C084FC',
                      fontSize: 13
                    }}
                  >
                    <EditIcon /> Editar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== COMPONENTE: LISTA DE USUARIOS =====
function ListaUsuarios({ usuarios, onAsignarEstablecimientos }) {
  return (
    <div style={adminStyles.card}>
      <div style={adminStyles.cardHeader}>
        <h2 style={adminStyles.cardTitle}>👥 Usuarios del Sistema</h2>
      </div>

      <table style={adminStyles.table}>
        <thead>
          <tr>
            <th style={adminStyles.th}>Usuario</th>
            <th style={adminStyles.th}>Email</th>
            <th style={adminStyles.th}>Roles</th>
            <th style={adminStyles.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(usuario => (
            <tr key={usuario.id}>
              <td style={adminStyles.td}>
                <strong style={{ color: '#F3F4F6' }}>
                  {usuario.alias || `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Sin nombre'}
                </strong>
              </td>
              <td style={adminStyles.td}>
                <span style={{ color: '#9CA3AF', fontSize: 14 }}>{usuario.email}</span>
              </td>
              <td style={adminStyles.td}>
                {usuario.roles && usuario.roles.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {usuario.roles.map(rol => (
                      <span
                        key={rol.id}
                        style={{
                          ...adminStyles.badge,
                          backgroundColor: `${rol.color}20`,
                          color: rol.color || '#C084FC'
                        }}
                      >
                        {rol.nombre}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: '#9CA3AF', fontSize: 13 }}>Sin roles</span>
                )}
              </td>
              <td style={adminStyles.td}>
                <button
                  onClick={() => onAsignarEstablecimientos(usuario)}
                  style={{
                    ...adminStyles.actionButton,
                    backgroundColor: 'rgba(249, 115, 22, 0.15)',
                    color: '#F97316',
                    fontSize: 13
                  }}
                >
                  <BuildingIcon /> Establecimientos
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== MODAL: EDITAR/CREAR ROL =====
function EditarRolModal({ rol, onClose, onSave }) {
  const [nombre, setNombre] = useState(rol?.nombre || '');
  const [descripcion, setDescripcion] = useState(rol?.descripcion || '');
  const [color, setColor] = useState(rol?.color || '#6B7280');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: rol?.id,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      color: color
    });
  };

  return (
    <div style={adminStyles.modalOverlay} onClick={onClose}>
      <div style={adminStyles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={adminStyles.modalTitle}>
          {rol ? '✏️ Editar Rol' : '✨ Crear Nuevo Rol'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={adminStyles.formGroup}>
            <label style={adminStyles.formLabel}>Nombre del Rol *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={rol?.is_system}
              style={adminStyles.formInput}
              placeholder="ej. gerente, supervisor"
            />
          </div>

          <div style={adminStyles.formGroup}>
            <label style={adminStyles.formLabel}>Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              style={adminStyles.formInput}
              placeholder="ej. Gestiona múltiples establecimientos"
            />
          </div>

          <div style={adminStyles.formGroup}>
            <label style={adminStyles.formLabel}>Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                width: '100%',
                height: 48,
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer'
              }}
            />
          </div>

          <div style={adminStyles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...adminStyles.modalButton,
                backgroundColor: 'rgba(156, 163, 175, 0.2)',
                color: '#9CA3AF'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                ...adminStyles.modalButton,
                backgroundColor: '#10B981',
                color: 'white'
              }}
            >
              {rol ? 'Actualizar' : 'Crear Rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== MODAL: ASIGNAR PERMISOS =====
function AsignarPermisosModal({ rol, permisos, permisosAsignados, onClose, onSave }) {
  const [seleccionados, setSeleccionados] = useState(
    permisosAsignados.map(p => p.id)
  );

  const togglePermiso = (permisoId) => {
    setSeleccionados(prev =>
      prev.includes(permisoId)
        ? prev.filter(id => id !== permisoId)
        : [...prev, permisoId]
    );
  };

  const handleSubmit = () => {
    onSave(rol.id, seleccionados);
  };

  // Agrupar permisos por módulo
  const permisosPorModulo = {};
  permisos.forEach(p => {
    if (!permisosPorModulo[p.modulo]) {
      permisosPorModulo[p.modulo] = [];
    }
    permisosPorModulo[p.modulo].push(p);
  });

  return (
    <div style={adminStyles.modalOverlay} onClick={onClose}>
      <div style={adminStyles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={adminStyles.modalTitle}>
          🔑 Permisos para "{rol.nombre}"
        </h2>

        <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
          {Object.entries(permisosPorModulo).map(([modulo, perms]) => (
            <div key={modulo} style={{ marginBottom: 24 }}>
              <h3 style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: '#C4B5FD',
                marginBottom: 12,
                textTransform: 'capitalize'
              }}>
                📁 {modulo.replace('_', ' ')}
              </h3>

              {perms.map(permiso => {
                const isChecked = seleccionados.includes(permiso.id);
                return (
                  <label
                    key={permiso.id}
                    style={{
                      ...adminStyles.checkboxLabel,
                      borderColor: isChecked ? `${rol.color}40` : undefined,
                      backgroundColor: isChecked ? `${rol.color}15` : undefined
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermiso(permiso.id)}
                      style={adminStyles.checkbox}
                    />
                    <div>
                      <strong style={{ color: '#F3F4F6' }}>{permiso.nombre}</strong>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF' }}>
                        {permiso.descripcion}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          ))}
        </div>

        <div style={adminStyles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...adminStyles.modalButton,
              backgroundColor: 'rgba(156, 163, 175, 0.2)',
              color: '#9CA3AF'
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              ...adminStyles.modalButton,
              backgroundColor: '#C084FC',
              color: 'white'
            }}
          >
            Guardar Permisos
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== MODAL: ASIGNAR ESTABLECIMIENTOS =====
function AsignarEstablecimientosModal({ usuario, establecimientos, asignaciones, onClose, onSave }) {
  const [seleccionados, setSeleccionados] = useState(
    asignaciones.map(a => ({
      establecimiento_id: a.establecimiento_id,
      puede_editar: a.puede_editar,
      puede_crear_cupones: a.puede_crear_cupones,
      puede_aprobar_canjes: a.puede_aprobar_canjes
    }))
  );

  const toggleEstablecimiento = (estId) => {
    setSeleccionados(prev => {
      const existe = prev.find(e => e.establecimiento_id === estId);
      if (existe) {
        return prev.filter(e => e.establecimiento_id !== estId);
      }
      return [
        ...prev,
        {
          establecimiento_id: estId,
          puede_editar: true,
          puede_crear_cupones: true,
          puede_aprobar_canjes: true
        }
      ];
    });
  };

  const togglePermisoEst = (estId, campo) => {
    setSeleccionados(prev =>
      prev.map(e =>
        e.establecimiento_id === estId
          ? { ...e, [campo]: !e[campo] }
          : e
      )
    );
  };

  const handleSubmit = () => {
    onSave(usuario.id, seleccionados);
  };

  return (
    <div style={adminStyles.modalOverlay} onClick={onClose}>
      <div style={adminStyles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={adminStyles.modalTitle}>
          🏨 Establecimientos para {usuario.alias || usuario.email}
        </h2>

        <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
          {establecimientos.map(est => {
            const asignado = seleccionados.find(e => e.establecimiento_id === est.id);
            return (
              <div
                key={est.id}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  borderRadius: 10,
                  border: `1px solid ${asignado ? '#C084FC' : 'rgba(156, 163, 175, 0.2)'}`,
                  background: asignado ? 'rgba(192, 132, 252, 0.08)' : 'rgba(30, 30, 45, 0.6)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    checked={!!asignado}
                    onChange={() => toggleEstablecimiento(est.id)}
                    style={adminStyles.checkbox}
                  />
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#F3F4F6', fontSize: 16 }}>{est.nombre}</strong>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#9CA3AF' }}>
                      {est.tipo === 'motel' ? '🏨 Motel' : est.tipo === 'bar' ? '🍸 Bar' : est.tipo === 'nightclub' ? '🌙 Night Club' : '💃 Table Dance'}
                    </p>
                  </div>
                </div>

                {asignado && (
                  <div style={{ paddingLeft: 32, paddingTop: 12, borderTop: '1px solid rgba(192, 132, 252, 0.2)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <input
                        type="checkbox"
                        checked={asignado.puede_editar}
                        onChange={() => togglePermisoEst(est.id, 'puede_editar')}
                        style={adminStyles.checkbox}
                      />
                      <span style={{ color: '#C4B5FD', fontSize: 14 }}>Puede editar</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <input
                        type="checkbox"
                        checked={asignado.puede_crear_cupones}
                        onChange={() => togglePermisoEst(est.id, 'puede_crear_cupones')}
                        style={adminStyles.checkbox}
                      />
                      <span style={{ color: '#C4B5FD', fontSize: 14 }}>Puede crear cupones</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={asignado.puede_aprobar_canjes}
                        onChange={() => togglePermisoEst(est.id, 'puede_aprobar_canjes')}
                        style={adminStyles.checkbox}
                      />
                      <span style={{ color: '#C4B5FD', fontSize: 14 }}>Puede aprobar canjes</span>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={adminStyles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...adminStyles.modalButton,
              backgroundColor: 'rgba(156, 163, 175, 0.2)',
              color: '#9CA3AF'
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              ...adminStyles.modalButton,
              backgroundColor: '#F97316',
              color: 'white'
            }}
          >
            Guardar Asignación
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export default function AdminRolesScreen() {
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [establecimientos, setEstablecimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [showEditarRol, setShowEditarRol] = useState(false);
  const [rolEditando, setRolEditando] = useState(null);
  
  const [showPermisos, setShowPermisos] = useState(false);
  const [rolPermisos, setRolPermisos] = useState(null);
  const [permisosAsignados, setPermisosAsignados] = useState([]);
  
  const [showEstablecimientos, setShowEstablecimientos] = useState(false);
  const [usuarioEstablecimientos, setUsuarioEstablecimientos] = useState(null);
  const [asignacionesUsuario, setAsignacionesUsuario] = useState([]);

  // Verificar rol de admin
  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }
  }, [role, navigate]);

  // Cargar datos iniciales
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('nombre');

      if (rolesError) throw rolesError;

      // Cargar permisos
      const { data: permisosData, error: permisosError } = await supabase
        .from('permisos')
        .select('*')
        .order('modulo, accion');

      if (permisosError) throw permisosError;

      // Cargar usuarios con sus roles
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('vista_usuarios_roles')
        .select('*');

      if (usuariosError) throw usuariosError;

      // Agrupar roles por usuario
      const usuariosConRoles = {};
      usuariosData.forEach(u => {
        if (!usuariosConRoles[u.usuario_id]) {
          usuariosConRoles[u.usuario_id] = {
            id: u.usuario_id,
            email: u.email,
            nombre: u.nombre,
            apellido: u.apellido,
            alias: u.alias,
            roles: []
          };
        }
        if (u.rol_nombre) {
          usuariosConRoles[u.usuario_id].roles.push({
            id: u.rol_id,
            nombre: u.rol_nombre,
            descripcion: u.rol_descripcion
          });
        }
      });

      // Cargar establecimientos
      const { data: estData, error: estError } = await supabase
        .from('establecimientos')
        .select('id, nombre, tipo, status')
        .eq('status', 'activo')
        .order('nombre');

      if (estError) throw estError;

      setRoles(rolesData || []);
      setPermisos(permisosData || []);
      setUsuarios(Object.values(usuariosConRoles));
      setEstablecimientos(estData || []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      alert('Error al cargar datos de administración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ===== FUNCIONES CRUD =====

  const handleCrearEditarRol = async (rolData) => {
    try {
      if (rolData.id) {
        // Actualizar rol existente
        const { error } = await supabase
          .from('roles')
          .update({
            nombre: rolData.nombre,
            descripcion: rolData.descripcion,
            color: rolData.color,
            updated_at: new Date().toISOString()
          })
          .eq('id', rolData.id);

        if (error) throw error;
      } else {
        // Crear nuevo rol
        const { error } = await supabase
          .from('roles')
          .insert({
            nombre: rolData.nombre,
            descripcion: rolData.descripcion,
            color: rolData.color
          });

        if (error) throw error;
      }

      alert(rolData.id ? 'Rol actualizado exitosamente' : 'Rol creado exitosamente');
      setShowEditarRol(false);
      setRolEditando(null);
      await cargarDatos();
    } catch (err) {
      console.error('Error al guardar rol:', err);
      alert('Error al guardar el rol: ' + err.message);
    }
  };

  const handleAsignarPermisos = async (rolId, permisoIds) => {
    try {
      // Eliminar permisos actuales del rol
      await supabase
        .from('rol_permisos')
        .delete()
        .eq('rol_id', rolId);

      // Insertar nuevos permisos
      if (permisoIds.length > 0) {
        const inserts = permisoIds.map(permisoId => ({
          rol_id: rolId,
          permiso_id: permisoId
        }));

        const { error } = await supabase
          .from('rol_permisos')
          .insert(inserts);

        if (error) throw error;
      }

      alert('Permisos actualizados exitosamente');
      setShowPermisos(false);
      setRolPermisos(null);
      await cargarDatos();
    } catch (err) {
      console.error('Error al asignar permisos:', err);
      alert('Error al asignar permisos: ' + err.message);
    }
  };

  const handleAsignarEstablecimientos = async (usuarioId, asignaciones) => {
    try {
      // Eliminar asignaciones actuales del usuario
      await supabase
        .from('usuario_establecimientos')
        .delete()
        .eq('usuario_id', usuarioId);

      // Insertar nuevas asignaciones
      if (asignaciones.length > 0) {
        const inserts = asignaciones.map(asig => ({
          usuario_id: usuarioId,
          establecimiento_id: asig.establecimiento_id,
          puede_editar: asig.puede_editar,
          puede_crear_cupones: asig.puede_crear_cupones,
          puede_aprobar_canjes: asig.puede_aprobar_canjes,
          asignado_por: currentUser.id
        }));

        const { error } = await supabase
          .from('usuario_establecimientos')
          .insert(inserts);

        if (error) throw error;
      }

      alert('Establecimientos asignados exitosamente');
      setShowEstablecimientos(false);
      setUsuarioEstablecimientos(null);
      await cargarDatos();
    } catch (err) {
      console.error('Error al asignar establecimientos:', err);
      alert('Error al asignar establecimientos: ' + err.message);
    }
  };

  // ===== MANEJADORES DE MODALES =====

  const abrirEditarRol = (rol) => {
    setRolEditando(rol);
    setShowEditarRol(true);
  };

  const abrirAsignarPermisos = async (rol) => {
    try {
      const { data, error } = await supabase
        .from('rol_permisos')
        .select('permiso_id')
        .eq('rol_id', rol.id);

      if (error) throw error;

      setRolPermisos(rol);
      setPermisosAsignados(data || []);
      setShowPermisos(true);
    } catch (err) {
      console.error('Error al cargar permisos del rol:', err);
      alert('Error al cargar permisos');
    }
  };

  const abrirAsignarEstablecimientos = async (usuario) => {
    try {
      const { data, error } = await supabase
        .from('usuario_establecimientos')
        .select('*')
        .eq('usuario_id', usuario.id);

      if (error) throw error;

      setUsuarioEstablecimientos(usuario);
      setAsignacionesUsuario(data || []);
      setShowEstablecimientos(true);
    } catch (err) {
      console.error('Error al cargar establecimientos del usuario:', err);
      alert('Error al cargar establecimientos');
    }
  };

  // ===== RENDER =====

  if (loading) {
    return (
      <div style={adminStyles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
          <div style={globalStyles.spinner} />
          <p style={{ color: '#9CA3AF' }}>Cargando administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={adminStyles.container}>
      {/* HEADER */}
      <header style={adminStyles.header}>
        <button
          onClick={() => navigate('/')}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(192, 132, 252, 0.15)',
            border: '2px solid rgba(192, 132, 252, 0.3)',
            color: '#C084FC',
            cursor: 'pointer',
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(192, 132, 252, 0.3)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(192, 132, 252, 0.15)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <BackIcon />
        </button>
        <h1 style={adminStyles.headerTitle}>⚙️ Administración de Roles</h1>
        <div style={{ width: 44 }} />
      </header>

      {/* TABS */}
      <div style={adminStyles.tabs}>
        <button
          onClick={() => setActiveTab('roles')}
          style={{
            ...adminStyles.tabButton,
            color: activeTab === 'roles' ? '#C084FC' : '#9CA3AF',
            borderBottomColor: activeTab === 'roles' ? '#C084FC' : 'transparent'
          }}
        >
          🎭 Roles
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          style={{
            ...adminStyles.tabButton,
            color: activeTab === 'usuarios' ? '#C084FC' : '#9CA3AF',
            borderBottomColor: activeTab === 'usuarios' ? '#C084FC' : 'transparent'
          }}
        >
          👥 Usuarios
        </button>
      </div>

      {/* CONTENIDO */}
      {activeTab === 'roles' ? (
        <ListaRoles
          roles={roles}
          onEditRol={abrirEditarRol}
          onAsignarPermisos={abrirAsignarPermisos}
          onAsignarUsuarios={() => alert('Función de asignar usuarios a roles próximamente')}
        />
      ) : (
        <ListaUsuarios
          usuarios={usuarios}
          onAsignarEstablecimientos={abrirAsignarEstablecimientos}
        />
      )}

      {/* MODALES */}
      {showEditarRol && (
        <EditarRolModal
          rol={rolEditando}
          onClose={() => {
            setShowEditarRol(false);
            setRolEditando(null);
          }}
          onSave={handleCrearEditarRol}
        />
      )}

      {showPermisos && (
        <AsignarPermisosModal
          rol={rolPermisos}
          permisos={permisos}
          permisosAsignados={permisosAsignados}
          onClose={() => {
            setShowPermisos(false);
            setRolPermisos(null);
            setPermisosAsignados([]);
          }}
          onSave={handleAsignarPermisos}
        />
      )}

      {showEstablecimientos && (
        <AsignarEstablecimientosModal
          usuario={usuarioEstablecimientos}
          establecimientos={establecimientos}
          asignaciones={asignacionesUsuario}
          onClose={() => {
            setShowEstablecimientos(false);
            setUsuarioEstablecimientos(null);
            setAsignacionesUsuario([]);
          }}
          onSave={handleAsignarEstablecimientos}
        />
      )}
    </div>
  );
}
// src/screens/AdminDashboard.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { globalStyles, adminStyles, colors } from '../styles/globalStyles';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ------------------------------------------------------------------
// Iconos
// ------------------------------------------------------------------
const BackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
);
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

// ------------------------------------------------------------------
// Error Boundary improvisado
// ------------------------------------------------------------------
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error('❌ ErrorBoundary:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: '#ef4444', background: '#1a1a2e', border: `1px solid ${colors.danger}`, borderRadius: 12 }}>
          <h3>Ups, algo rompió la pantalla</h3>
          <p>{this.state.error?.message || 'Error desconocido'}</p>
          <details style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</details>
          <button onClick={() => this.setState({ hasError: false, error: null })} style={{ ...globalStyles.button, backgroundColor: colors.primary, marginTop: 16 }}>Reintentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ------------------------------------------------------------------
// Hook genérico para usuarios / proveedores
// ------------------------------------------------------------------
function useListaPorRol(rol) {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', rol)
        .neq('status', 'eliminado')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLista(data ?? []);
    } catch (err) {
      console.error(`Error ${rol}:`, err);
      setLista([]);
    } finally {
      setLoading(false);
    }
  }, [rol]);

  useEffect(() => { fetch(); }, [fetch]);

  return { lista, loading, refetch: fetch };
}

// ------------------------------------------------------------------
// Formulario único: alta/edición usuario/proveedor
// ------------------------------------------------------------------
function FormularioUsuario({ initial, onSave, onCancel }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [alias, setAlias] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState('cliente');
  const [status, setStatus] = useState('activo');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initial) {
      setEmail(initial.email);
      setNombre(initial.nombre);
      setApellido(initial.apellido);
      setAlias(initial.alias);
      setTelefono(initial.telefono ?? '');
      setRol(initial.rol);
      setStatus(initial.status ?? 'activo');
      setPassword('');
    } else {
      setEmail(''); setPassword(''); setNombre(''); setApellido(''); setAlias(''); setTelefono(''); setRol('cliente'); setStatus('activo');
    }
  }, [initial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !nombre || !apellido || !alias) {
      alert('Completa los campos obligatorios.');
      return;
    }
    setLoading(true);
    try {
      if (initial?.id) {
        // Editar
        await supabase
          .from('usuarios')
          .update({
            email,
            nombre,
            apellido,
            alias,
            telefono,
            genero: 'X',
            fecha_nacimiento: '1990-01-01',
            rol,
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', initial.id);
        alert('✅ Actualizado');
      } else {
        // Crear
        const { data, error: signError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nombre, apellido, alias, telefono, rol } }
        });
        if (signError) throw signError;
        const { error: dbError } = await supabase.from('usuarios').insert({
          id: data.user.id,
          email,
          nombre,
          apellido,
          alias,
          telefono,
          genero: 'X',
          fecha_nacimiento: '1990-01-01',
          rol,
          status: 'activo'
        });
        if (dbError) throw dbError;
        alert('✅ Creado');
      }
      onSave();
    } catch (err) {
      alert('Error: ' + (err.message || 'Desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: colors.cardBg, padding: 20, borderRadius: 12, marginBottom: 24, border: `1px solid ${colors.border}` }}>
      <h3 style={{ color: 'white', marginBottom: 16 }}>{initial ? `Editar: ${alias}` : 'Nuevo Usuario / Proveedor'}</h3>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} style={globalStyles.input} required />
        {!initial && <input type="password" placeholder="Contraseña (8+)" value={password} onChange={e => setPassword(e.target.value)} style={globalStyles.input} required minLength={8} />}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} style={globalStyles.input} required />
          <input type="text" placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} style={globalStyles.input} required />
        </div>
        <input type="text" placeholder="Alias" value={alias} onChange={e => setAlias(e.target.value)} style={globalStyles.input} required />
        <input type="tel" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} style={globalStyles.input} />
        <select value={rol} onChange={e => setRol(e.target.value)} style={globalStyles.input}>
          <option value="cliente">Cliente</option>
          <option value="proveedor">Proveedor</option>
          <option value="admin">Administrador</option>
        </select>
        {initial && (
          <select value={status} onChange={e => setStatus(e.target.value)} style={globalStyles.input}>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button type="submit" disabled={loading} style={{ ...globalStyles.button, backgroundColor: loading ? '#6B7280' : colors.primary, flex: 1 }}>{loading ? 'Guardando...' : 'Guardar'}</button>
          <button type="button" onClick={onCancel} style={{ ...globalStyles.button, backgroundColor: '#6B7280', flex: 1 }}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

// ------------------------------------------------------------------
// Lista unificada: usuarios + proveedores
// ------------------------------------------------------------------
function ListaUsuariosProveedores({ user }) {
  const [modo, setModo] = useState('cliente'); // 'cliente' | 'proveedor'
  const { lista, loading, refetch } = useListaPorRol(modo);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSave = () => { setShowForm(false); setEditing(null); refetch(); };
  const handleCancel = () => { setShowForm(false); setEditing(null); };

  const toggleStatus = async (id, alias, actual) => {
    const nuevo = actual === 'activo' ? 'inactivo' : 'activo';
    if (!window.confirm(`¿${actual === 'activo' ? 'Inhabilitar' : 'Habilitar'} a "${alias}"?`)) return;
    try {
      const { error } = await supabase.from('usuarios').update({ status: nuevo, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      refetch();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  /* ------------------------------------------------------------------
     RENDER con blindaje
  ------------------------------------------------------------------ */
  try {
    const safeList = lista ?? [];
    console.log(`🔍 safeList ${modo}:`, safeList);

    return (
      <div>
        <div style={{ ...adminStyles.flexBetween, marginBottom: 24 }}>
          <h2 style={{ color: 'white', fontSize: 24 }}>Usuarios / Proveedores</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setModo('cliente')}
              style={{ ...globalStyles.filterButton, backgroundColor: modo === 'cliente' ? colors.primary : 'rgba(192,132,252,0.2)', color: modo === 'cliente' ? 'white' : colors.primary }}
            >
              👥 Clientes
            </button>
            <button
              onClick={() => setModo('proveedor')}
              style={{ ...globalStyles.filterButton, backgroundColor: modo === 'proveedor' ? colors.primary : 'rgba(192,132,252,0.2)', color: modo === 'proveedor' ? 'white' : colors.primary }}
            >
              👤 Proveedores
            </button>
            <button onClick={() => { setEditing(null); setShowForm(true); }} style={{ ...globalStyles.button, backgroundColor: colors.primary }}>
              + Nuevo
            </button>
          </div>
        </div>

        {showForm && <FormularioUsuario initial={editing} onSave={handleSave} onCancel={handleCancel} />}

        {loading ? (
          <p style={{ color: colors.textMuted }}>Cargando...</p>
        ) : safeList.length === 0 ? (
          <div style={{ padding: 20, color: colors.textMuted, textAlign: 'center' }}>
            <p>No hay {modo === 'cliente' ? 'clientes' : 'proveedores'} con estado "activo".</p>
            <p style={{ fontSize: 12 }}>Crea uno nuevo o revisa el campo status en la BBDD.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {safeList.map(p => (
              <div key={p.id} style={{ ...adminStyles.listItem, border: `1px solid ${p.status === 'activo' ? colors.success : '#EF4444'}` }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', color: p.rol === 'admin' ? colors.neonPink : p.rol === 'proveedor' ? '#8B5CF6' : '#60A5FA' }}>
                    {p.alias || `${p.nombre} ${p.apellido}`}
                  </p>
                  <p style={{ fontSize: 13, color: colors.textMuted }}>{p.email}</p>
                  <p style={{ fontSize: 12, color: p.status === 'activo' ? colors.success : '#EF4444' }}>{p.rol} • {p.status}</p>
                </div>
                <div style={{ ...adminStyles.gap12 }}>
                  <button onClick={() => setEditing(p)} style={{ ...globalStyles.buttonSmall, backgroundColor: '#3B82F6' }}>Editar</button>
                  {p.id !== user?.id && (
                    <button onClick={() => toggleStatus(p.id, p.alias, p.status)} style={{ ...globalStyles.buttonSmall, backgroundColor: p.status === 'activo' ? '#EF4444' : '#10B981' }}>
                      {p.status === 'activo' ? 'Inhabilitar' : 'Habilitar'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (renderErr) {
    console.error(`❌ Render UsuariosProveedores CRASH`, renderErr);
    return <div style={{ padding: 20, color: '#ef4444' }}>Error al mostrar {modo}s: {renderErr.message}</div>;
  }
}

// ------------------------------------------------------------------
// Dashboard de estadísticas (sin cambios)
// ------------------------------------------------------------------
function DashboardHome() {
  const [stats, setStats] = useState({ usuarios: 0, cuponesVendidos: 0, ingresos: 0, establecimientos: 0 });
  const [ventasMensuales, setVentasMensuales] = useState([]);
  const [topEstablecimientos, setTopEstablecimientos] = useState([]);
  const [distribucionTipos, setDistribucionTipos] = useState([]);
  const COLORS = ['#C084FC', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#3B82F6'];

  useEffect(() => {
    const fetch = async () => {
      try {
        const [{ count: usuarios }, { data: vendidos }, { count: establecimientos }] = await Promise.all([
          supabase.from('usuarios').select('id', { count: 'exact', head: true }).eq('rol', 'cliente'),
          supabase.from('cupones').select('precio_cupon, redeemed_at').eq('status', 'sold'),
          supabase.from('establecimientos').select('*', { count: 'exact', head: true }).eq('status', 'activo')
        ]);
        const cuponesVendidos = vendidos?.length || 0;
        const ingresos = vendidos?.reduce((a, c) => a + c.precio_cupon, 0) || 0;
        const ventasPorMes = {};
        vendidos?.forEach(v => {
          const mes = new Date(v.redeemed_at).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
          ventasPorMes[mes] = (ventasPorMes[mes] || 0) + v.precio_cupon;
        });
        const ventasMensuales = Object.entries(ventasPorMes).map(([mes, total]) => ({ mes, total }));
        const { data: topEstData } = await supabase.from('cupones').select('establecimiento_id, establecimientos(nombre)').eq('status', 'sold');
        const countMap = topEstData?.reduce((a, c) => {
          a[c.establecimiento_id] = (a[c.establecimiento_id] || 0) + 1;
          return a;
        }, {});
        const topEstablecimientos = Object.entries(countMap || {})
          .map(([id, ventas]) => ({
            nombre: topEstData.find(e => e.establecimiento_id === id)?.establecimientos?.nombre || 'Desconocido',
            ventas
          }))
          .sort((a, b) => b.ventas - a.ventas)
          .slice(0, 5);
        const { data: tiposData } = await supabase.from('establecimientos').select('tipo').eq('status', 'activo');
        const tipoCount = tiposData?.reduce((a, e) => {
          a[e.tipo] = (a[e.tipo] || 0) + 1;
          return a;
        }, {});
        const distribucionTipos = Object.entries(tipoCount || {}).map(([name, value]) => ({ name, value }));
        setStats({ usuarios: usuarios || 0, cuponesVendidos, ingresos, establecimientos: establecimientos || 0 });
        setVentasMensuales(ventasMensuales.length ? ventasMensuales : [{ mes: 'Sin datos', total: 0 }]);
        setTopEstablecimientos(topEstablecimientos);
        setDistribucionTipos(distribucionTipos);
      } catch (err) {
        console.error(err);
        setStats({ usuarios: 0, cuponesVendidos: 0, ingresos: 0, establecimientos: 0 });
      }
    };
    fetch();
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 40 }}>Dashboard de Ventas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginBottom: 48 }}>
        {[
          { label: 'Usuarios', value: stats.usuarios, color: '#8B5CF6' },
          { label: 'Cupones Vendidos', value: stats.cuponesVendidos, color: '#10B981' },
          { label: 'Ingresos Totales', value: `$${stats.ingresos.toLocaleString('es-MX')}`, color: '#F59E0B' },
          { label: 'Establecimientos', value: stats.establecimientos, color: '#EC4899' },
        ].map((s, i) => (
          <div key={i} style={adminStyles.statCard}>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: 15 }}>{s.label}</p>
            <p style={{ margin: '12px 0 0', fontSize: 36, fontWeight: 'bold', color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 48 }}>
        <div style={adminStyles.chartContainer}>
          <h3 style={{ color: colors.primary, margin: '0 0 20px' }}>Ventas Mensuales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ventasMensuales}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(192,132,252,0.1)" />
              <XAxis dataKey="mes" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: `1px solid ${colors.primary}` }} />
              <Line type="monotone" dataKey="total" stroke="#C084FC" strokeWidth={4} dot={{ fill: '#C084FC' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={adminStyles.chartContainer}>
          <h3 style={{ color: colors.primary, margin: '0 0 20px' }}>Top Establecimientos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topEstablecimientos}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(192,132,252,0.1)" />
              <XAxis dataKey="nombre" stroke="#94A3B8" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#94A3B8" />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: `1px solid ${colors.primary}` }} />
              <Bar dataKey="ventas" fill="#EC4899" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ ...adminStyles.chartContainer, maxWidth: 600, margin: '0 auto' }}>
        <h3 style={{ color: colors.primary, margin: '0 0 20px', textAlign: 'center' }}>Distribución por Tipo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={distribucionTipos} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {distribucionTipos.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#1a1a2e', border: `1px solid ${colors.primary}` }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Cupones (sin cambios respecto a tu última versión)
// ------------------------------------------------------------------
function GestionCupones() {
  const [activeTab, setActiveTab] = useState('listado');
  const [cupones, setCupones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCupon, setEditingCupon] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoEstablecimiento, setTipoEstablecimiento] = useState('motel');
  const [establecimientos, setEstablecimientos] = useState([]);
  const [habitacionesPorEst, setHabitacionesPorEst] = useState({});
  const [cantidadPorHabitacion, setCantidadPorHabitacion] = useState({});
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    if (activeTab === 'listado') fetchCupones();
    if (activeTab === 'generar') fetchEstablecimientos();
  }, [activeTab, tipoEstablecimiento]);

  const fetchCupones = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('cupones').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const estIds = [...new Set(data.map(c => c.establecimiento_id).filter(Boolean))];
      const habIds = [...new Set(data.map(c => c.habitacion_id).filter(Boolean))];
      const [{ data: ests }, { data: habs }] = await Promise.all([
        estIds.length ? supabase.from('establecimientos').select('id, nombre, tipo').in('id', estIds) : Promise.resolve({ data: [] }),
        habIds.length ? supabase.from('habitaciones').select('id, nombre').in('id', habIds) : Promise.resolve({ data: [] })
      ]);
      const completos = data.map(c => ({
        ...c,
        establecimientos: ests?.find(e => e.id === c.establecimiento_id) || { nombre: 'Sin asignar', tipo: 'N/A' },
        habitaciones: habs?.find(h => h.id === c.habitacion_id) || { nombre: 'Sin asignar' }
      }));
      setCupones(completos);
    } catch (err) {
      console.error(err);
      setCupones([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstablecimientos = async () => {
    setLoading(true);
    try {
      const { data: ests, error } = await supabase
        .from('establecimientos')
        .select('id, nombre')
        .eq('tipo', tipoEstablecimiento)
        .eq('status', 'activo')
        .order('nombre');
      if (error) throw error;
      setEstablecimientos(ests || []);
      const map = {};
      if (ests?.length) {
        const { data: rooms } = await supabase
          .from('habitaciones')
          .select('id, establecimiento_id, nombre, precio')
          .in('establecimiento_id', ests.map(e => e.id))
          .order('nombre');
        rooms?.forEach(r => {
          if (!map[r.establecimiento_id]) map[r.establecimiento_id] = [];
          map[r.establecimiento_id].push(r);
        });
      }
      setHabitacionesPorEst(map);
    } catch (err) {
      console.error(err);
      setHabitacionesPorEst({});
    } finally {
      setLoading(false);
    }
  };

  const cuponesFiltrados = React.useMemo(() => {
    return cupones.filter(c => {
      const matchTipo = filtroTipo === 'todos' || c.establecimientos?.tipo === filtroTipo;
      const matchEstado = filtroEstado === 'todos' || c.status === filtroEstado;
      const matchSearch = !searchTerm ||
        c.nombre_cupon?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.establecimientos?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTipo && matchEstado && matchSearch;
    });
  }, [cupones, filtroTipo, filtroEstado, searchTerm]);

  const openEditForm = (cupon) => {
    setEditingCupon(cupon);
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await supabase
        .from('cupones')
        .update({
          nombre_cupon: editingCupon.nombre_cupon,
          precio_cupon: parseFloat(editingCupon.precio_cupon),
          validity_start: editingCupon.validity_start,
          validity_end: editingCupon.validity_end,
          status: editingCupon.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCupon.id);
      setShowEditForm(false);
      fetchCupones();
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const deleteCupon = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar cupón "${nombre}"?`)) return;
    try {
      await supabase.from('cupones').delete().eq('id', id);
      fetchCupones();
    } catch (err) {
      console.error(err);
    }
  };

const generarCuponesMasivos = async () => {
  // 1. Validar entradas temprano
  const validEntries = Object.entries(cantidadPorHabitacion).filter(([, qty]) => qty > 0);
  const totalCupones = validEntries.reduce((sum, [, qty]) => sum + qty, 0);
  if (totalCupones === 0) {
    alert('⚠️ Por favor, ingresa al menos una cantidad mayor a 0.');
    return;
  }
  if (!window.confirm(`¿Estás seguro de generar ${totalCupones} cupones?`)) return;

  setGenerando(true);

  try {
    // 2. ✅ Precomputar mapa: habitacionId → { establecimientoId, nombre, precio }
    const habitacionMap = {};
    for (const [estId, habitaciones] of Object.entries(habitacionesPorEst)) {
      if (Array.isArray(habitaciones)) {
        habitaciones.forEach(hab => {
          habitacionMap[hab.id] = {
            establecimiento_id: estId,
            nombre_cupon: hab.nombre,
            precio_cupon: hab.precio
          };
        });
      }
    }

    // 3. ✅ Validar inmediatamente si hay habitaciones válidas
    const validHabitaciones = validEntries.filter(([habId]) => habitacionMap[habId]);
    if (validHabitaciones.length === 0) {
      alert('❌ Ninguna de las habitaciones seleccionadas tiene un establecimiento asociado.');
      setGenerando(false);
      return;
    }

    const hoy = new Date();
    const fin = new Date(hoy);
    fin.setDate(hoy.getDate() + 30);

    // 4. ✅ Generar batch usando el mapa (rápido y directo)
    const batch = [];
    for (const [habId, cantidad] of validHabitaciones) {
      const habData = habitacionMap[habId];
      for (let i = 0; i < cantidad; i++) {
        const uniqueId = 'LA' + crypto.randomUUID().substring(0, 24).toUpperCase().replace(/-/g, '');
        const codigo = 'LA' + crypto.randomUUID().substring(0, 8).toUpperCase().replace(/-/g, '');
        batch.push({
          id: uniqueId,
          establecimiento_id: habData.establecimiento_id,
          habitacion_id: habId,
          nombre_cupon: habData.nombre_cupon,
          precio_cupon: habData.precio_cupon,
          validity_start: hoy.toISOString().split('T')[0],
          validity_end: fin.toISOString().split('T')[0],
          status: 'onSale',
          codigo_redencion: codigo
        });
      }
    }

    // 5. Insertar en lotes
    if (batch.length === 0) {
      alert('❌ No se generó ningún cupón válido.');
      setGenerando(false);
      return;
    }

    const BATCH_SIZE = 100;
    let cuponesCreados = 0;
    for (let i = 0; i < batch.length; i += BATCH_SIZE) {
      const chunk = batch.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('cupones').insert(chunk);
      if (error) {
        console.error('Error al insertar lote:', error);
        throw new Error(`Fallo en inserción: ${error.message}`);
      }
      cuponesCreados += chunk.length;
    }

    alert(`✅ ¡${cuponesCreados} cupones creados exitosamente!`);
    setCantidadPorHabitacion({});
    setActiveTab('listado');
    fetchCupones();

  } catch (err) {
    console.error('Error en generación masiva:', err);
    alert(`❌ Error: ${err.message}`);
  } finally {
    setGenerando(false); // ← ¡Esto siempre se ejecuta!
  }
};

  return (
    <div>
      <div style={{ ...adminStyles.gap12, marginBottom: 24, borderBottom: `1px solid ${colors.border}`, paddingBottom: 16 }}>
        <button
          onClick={() => setActiveTab('listado')}
          style={{
            ...globalStyles.filterButton,
            backgroundColor: activeTab === 'listado' ? colors.primary : 'rgba(192,132,252,0.2)',
            color: activeTab === 'listado' ? 'white' : colors.primary
          }}
        >
          📋 Listado de Cupones
        </button>
        <button
          onClick={() => setActiveTab('generar')}
          style={{
            ...globalStyles.filterButton,
            backgroundColor: activeTab === 'generar' ? colors.primary : 'rgba(192,132,252,0.2)',
            color: activeTab === 'generar' ? 'white' : colors.primary
          }}
        >
          🚀 Generar Cupones
        </button>
      </div>

      {activeTab === 'listado' && (
        <div>
          <div style={{ ...adminStyles.gap12, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Buscar por nombre, ID o establecimiento..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ ...globalStyles.input, flex: 1, minWidth: 200 }}
            />
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={globalStyles.input}>
              <option value="todos">Todos los tipos</option>
              <option value="motel">Moteles</option>
              <option value="bar">Bares</option>
              <option value="nightclub">Nightclubs</option>
            </select>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={globalStyles.input}>
              <option value="todos">Todos los estados</option>
              <option value="onSale">En venta</option>
              <option value="sold">Vendido</option>
              <option value="usado">Usado</option>
              <option value="expired">Expirado</option>
            </select>
          </div>

          {loading ? (
            <p style={{ color: colors.textMuted }}>Cargando cupones...</p>
          ) : cuponesFiltrados.length === 0 ? (
            <p style={{ color: colors.textMuted }}>No hay cupones que coincidan.</p>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {cuponesFiltrados.map(c => (
                <div key={c.id} style={adminStyles.listItem}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: colors.primary, fontSize: 16 }}>{c.nombre_cupon}</p>
                    <p style={{ fontSize: 13, color: colors.textMuted, margin: '4px 0' }}>
                      {c.establecimientos?.nombre} • {c.habitaciones?.nombre}
                    </p>
                    <p style={{ fontSize: 14, color: colors.text, margin: '6px 0' }}>
                      <strong>${c.precio_cupon?.toLocaleString('es-MX')}</strong>
                    </p>
                    <p style={{ fontSize: 12, color: colors.textMuted }}>
                      Válido: {new Date(c.validity_start).toLocaleDateString('es-MX')} al {new Date(c.validity_end).toLocaleDateString('es-MX')}
                    </p>
                    <span style={{
                      fontSize: 12,
                      padding: '4px 8px',
                      borderRadius: 4,
                      backgroundColor: c.status === 'onSale' ? colors.success :
                                        c.status === 'sold' ? '#3B82F6' :
                                        c.status === 'usado' ? '#8B5CF6' : '#EF4444',
                      color: 'white',
                      display: 'inline-block',
                      marginTop: 8
                    }}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ ...adminStyles.gap12, flexDirection: 'column' }}>
                    <button
                      onClick={() => openEditForm(c)}
                      style={{ ...globalStyles.buttonSmall, backgroundColor: '#3B82F6' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteCupon(c.id, c.nombre_cupon)}
                      style={{ ...globalStyles.buttonSmall, backgroundColor: '#EF4444' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'generar' && (
        <div>
          <h3 style={{ color: 'white', marginBottom: 16 }}>Generar Cupones Masivos</h3>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: colors.text, marginBottom: 8 }}>Tipo de establecimiento:</label>
            <select
              value={tipoEstablecimiento}
              onChange={(e) => setTipoEstablecimiento(e.target.value)}
              style={globalStyles.input}
            >
              <option value="motel">Moteles</option>
              <option value="bar">Bares</option>
              <option value="nightclub">Night Clubs</option>
            </select>
          </div>

          {loading ? (
            <p style={{ color: colors.textMuted }}>Cargando establecimientos...</p>
          ) : establecimientos.length === 0 ? (
            <p style={{ color: colors.textMuted }}>No hay establecimientos activos del tipo "{tipoEstablecimiento}".</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {establecimientos.map(est => {
                const habs = habitacionesPorEst[est.id] || [];
                return (
                  <div key={est.id} style={adminStyles.listItem}>
                    <h4 style={{ color: 'white', margin: '0 0 12px', borderBottom: `1px solid ${colors.border}`, paddingBottom: 8 }}>{est.nombre}</h4>
                    {habs.length === 0 ? (
                      <p style={{ color: colors.textMuted }}>Sin habitaciones registradas</p>
                    ) : (
                      <div style={{ display: 'grid', gap: 12 }}>
                        {habs.map(hab => (
                          <div key={hab.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, color: 'white', fontSize: 15 }}>{hab.nombre}</p>
                              <p style={{ margin: '4px 0 0', color: colors.textMuted, fontSize: 13 }}>
                                Precio: ${hab.precio?.toLocaleString('es-MX')}
                              </p>
                            </div>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Cantidad"
                              value={cantidadPorHabitacion[hab.id] || ''}
                              onChange={e => setCantidadPorHabitacion({ ...cantidadPorHabitacion, [hab.id]: parseInt(e.target.value) || 0 })}
                              style={{ ...globalStyles.input, width: 100, fontSize: 14, padding: '8px' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {establecimientos.length > 0 && (
            <button
              onClick={generarCuponesMasivos}
              disabled={generando}
              style={{
                ...globalStyles.button,
                backgroundColor: generando ? '#6B7280' : colors.primary,
                width: '100%',
                padding: '14px 24px',
                fontSize: 16,
                fontWeight: 'bold',
                marginTop: 24
              }}
            >
              {generando ? 'Generando cupones...' : '🚀 Generar Cupones'}
            </button>
          )}
        </div>
      )}

      {showEditForm && editingCupon && (
        <div style={adminStyles.modalOverlay}>
          <div style={adminStyles.modalContent}>
            <h3 style={{ color: colors.primary, margin: '0 0 20px' }}>Editar Cupón</h3>
            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                placeholder="Nombre del cupón"
                value={editingCupon.nombre_cupon}
                onChange={e => setEditingCupon({ ...editingCupon, nombre_cupon: e.target.value })}
                style={globalStyles.input}
                required
              />
              <input
                type="number"
                placeholder="Precio"
                value={editingCupon.precio_cupon}
                onChange={e => setEditingCupon({ ...editingCupon, precio_cupon: e.target.value })}
                style={globalStyles.input}
                min={0}
                step="0.01"
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: colors.text, marginBottom: 4, fontSize: 12 }}>Inicio</label>
                  <input
                    type="date"
                    value={editingCupon.validity_start}
                    onChange={e => setEditingCupon({ ...editingCupon, validity_start: e.target.value })}
                    style={globalStyles.input}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: colors.text, marginBottom: 4, fontSize: 12 }}>Fin</label>
                  <input
                    type="date"
                    value={editingCupon.validity_end}
                    onChange={e => setEditingCupon({ ...editingCupon, validity_end: e.target.value })}
                    style={globalStyles.input}
                    required
                  />
                </div>
              </div>
              <select
                value={editingCupon.status}
                onChange={e => setEditingCupon({ ...editingCupon, status: e.target.value })}
                style={globalStyles.input}
              >
                <option value="onSale">En venta</option>
                <option value="sold">Vendido</option>
                <option value="redeemed">Usado</option>
              </select>
              <div style={{ ...adminStyles.gap12, marginTop: 20 }}>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    ...globalStyles.button,
                    backgroundColor: formLoading ? '#6B7280' : colors.primary,
                    flex: 1
                  }}
                >
                  {formLoading ? 'Guardando...' : 'Actualizar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  style={{
                    ...globalStyles.button,
                    backgroundColor: '#6B7280',
                    flex: 1
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Establecimientos (sin cambios respecto a tu última versión)
// ------------------------------------------------------------------
function ListaEstablecimientos() {
  const [establecimientos, setEstablecimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('motel');
  const [direccion, setDireccion] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [estado, setEstado] = useState('');
  const [colony, setColony] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cover_image, setCoverImage] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [habitaciones, setHabitaciones] = useState([{ nombre: '', capacidad: 2, precio: 0 }]);
  const [proveedores, setProveedores] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchEstablecimientos();
    fetchProveedores();
  }, []);

  const fetchEstablecimientos = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('establecimientos')
        .select('*')
        .eq('tipo', 'motel')
        .eq('status', 'activo')
        .order('created_at', { ascending: false });
      setEstablecimientos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProveedores = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', 'proveedor')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProveedores(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && !selectedFile.type.match('image.*')) {
      alert('Selecciona una imagen válida.');
      return;
    }
    setFile(selectedFile);
    if (selectedFile) setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const uploadCoverImage = async () => {
    if (!file) return cover_image;
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentId || Date.now()}.${fileExt}`;
    const filePath = `covers/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('covers').upload(filePath, file, { upsert: true });
    if (uploadError) {
      alert('Error al subir imagen');
      return null;
    }
    const { publicUrl } = supabase.storage.from('covers').getPublicUrl(filePath);
    return publicUrl;
  };

  const openEditForm = (est) => {
    setCurrentId(est.id);
    setIsEditing(true);
    setShowForm(true);
    setNombre(est.nombre);
    setTipo(est.tipo);
    setDireccion(est.direccion || '');
    setMunicipio(est.municipio || '');
    setEstado(est.estado || '');
    setColony(est.colony || '');
    setTelefono(est.telefono || '');
    setCoverImage(est.cover_image || '');
    setPreviewUrl(est.cover_image || null);
    setLat(est.coords?.latitude || '');
    setLng(est.coords?.longitude || '');
    setOwnerId(est.owner_id || '');
    loadHabitaciones(est.id);
  };

  const loadHabitaciones = async (estId) => {
    const { data } = await supabase
      .from('habitaciones')
      .select('id, nombre, capacidad, precio')
      .eq('establecimiento_id', estId);
    setHabitaciones(data?.length ? data : [{ nombre: '', capacidad: 2, precio: 0 }]);
  };

  const addHabitacion = () => setHabitaciones([...habitaciones, { nombre: '', capacidad: 2, precio: 0 }]);
  const updateHabitacion = (index, field, value) => {
    const newHabs = [...habitaciones];
    newHabs[index][field] = value;
    setHabitaciones(newHabs);
  };
  const removeHabitacion = (index) => setHabitaciones(habitaciones.filter((_, i) => i !== index));

  const deleteEstablecimiento = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}" y todas sus habitaciones?`)) return;
    try {
      await supabase.from('habitaciones').delete().eq('establecimiento_id', id);
      await supabase.from('establecimientos').delete().eq('id', id);
      fetchEstablecimientos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    let finalCoverUrl = cover_image;
    if (file) {
      finalCoverUrl = await uploadCoverImage();
      if (!finalCoverUrl) {
        setFormLoading(false);
        return;
      }
    }
    const coords = lat && lng ? { latitude: parseFloat(lat), longitude: parseFloat(lng) } : null;
    try {
      if (isEditing) {
        await supabase
          .from('establecimientos')
          .update({
            nombre,
            tipo,
            direccion,
            colony,
            municipio,
            estado,
            telefono,
            owner_id: ownerId || null,
            cover_image: finalCoverUrl,
            coords,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentId);
        await supabase.from('habitaciones').delete().eq('establecimiento_id', currentId);
        if (habitaciones.length > 0) {
          const roomInserts = habitaciones.map((h, i) => ({
            id: `${currentId}_room_${String(i + 1).padStart(3, '0')}`,
            establecimiento_id: currentId,
            nombre: h.nombre,
            capacidad: h.capacidad,
            precio: h.precio,
            imagenes: []
          }));
          await supabase.from('habitaciones').insert(roomInserts);
        }
      } else {
        const tipoPrefix = { motel: 'm', bar: 'b', nightclub: 'n', tabledance: 't' };
        const prefix = tipoPrefix[tipo] || 'x';
        const nextId = `${prefix}${establecimientos.filter(e => e.tipo === tipo).length + 1}`;
        const { data: estData, error: estError } = await supabase
          .from('establecimientos')
          .insert({
            id: nextId,
            tipo,
            nombre,
            direccion,
            colony,
            municipio,
            estado,
            telefono,
            owner_id: ownerId || null,
            cover_image: finalCoverUrl,
            coords,
            status: 'activo',
            amenities: [],
            conditions: []
          })
          .select()
          .single();
        if (estError) throw estError;
        if (habitaciones.length > 0) {
          const roomInserts = habitaciones.map((h, i) => ({
            id: `${nextId}_room_${String(i + 1).padStart(3, '0')}`,
            establecimiento_id: nextId,
            nombre: h.nombre,
            capacidad: h.capacidad,
            precio: h.precio,
            imagenes: []
          }));
          await supabase.from('habitaciones').insert(roomInserts);
        }
      }
      resetForm();
      fetchEstablecimientos();
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setCurrentId(null);
    setFile(null);
    setPreviewUrl(null);
    setNombre('');
    setDireccion('');
    setMunicipio('');
    setEstado('');
    setColony('');
    setTelefono('');
    setCoverImage('');
    setLat('');
    setLng('');
    setOwnerId('');
    setHabitaciones([{ nombre: '', capacidad: 2, precio: 0 }]);
  };

  return (
    <div>
      <div style={{ ...adminStyles.flexBetween, marginBottom: 24 }}>
        <h2 style={{ color: 'white', fontSize: 24 }}>Establecimientos</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{ ...globalStyles.button, backgroundColor: colors.primary }}>
          + Nuevo Establecimiento
        </button>
      </div>

      {showForm && (
        <div style={{ background: colors.cardBg, padding: 20, borderRadius: 12, marginBottom: 24, border: `1px solid ${colors.border}` }}>
          <h3 style={{ color: 'white', marginBottom: 16 }}>
            {isEditing ? `Editar: ${nombre}` : 'Nuevo Establecimiento'}
          </h3>
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} style={globalStyles.input} required />
            <select value={tipo} onChange={e => setTipo(e.target.value)} style={globalStyles.input}>
              <option value="motel">Motel</option>
              <option value="bar">Bar</option>
              <option value="nightclub">Nightclub</option>
              <option value="tabledance">Table Dance</option>
            </select>
            <input type="text" placeholder="Dirección" value={direccion} onChange={e => setDireccion(e.target.value)} style={globalStyles.input} />
            <input type="text" placeholder="Colonia" value={colony} onChange={e => setColony(e.target.value)} style={globalStyles.input} />
            <input type="text" placeholder="Municipio" value={municipio} onChange={e => setMunicipio(e.target.value)} style={globalStyles.input} />
            <input type="text" placeholder="Estado" value={estado} onChange={e => setEstado(e.target.value)} style={globalStyles.input} />
            <input type="tel" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} style={globalStyles.input} />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: colors.text, marginBottom: 6 }}>Imagen de portada</label>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ marginBottom: 8 }} />
              {(previewUrl || cover_image) && (
                <img src={previewUrl || cover_image} alt="Preview" style={{ width: '100%', maxWidth: 200, borderRadius: 8 }} />
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input type="text" placeholder="Latitud" value={lat} onChange={e => setLat(e.target.value)} style={globalStyles.input} />
              <input type="text" placeholder="Longitud" value={lng} onChange={e => setLng(e.target.value)} style={globalStyles.input} />
            </div>
            <select value={ownerId} onChange={e => setOwnerId(e.target.value)} style={globalStyles.input}>
              <option value="">Sin proveedor</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.alias}</option>)}
            </select>
            <h3 style={{ color: 'white', margin: '20px 0 12px' }}>Habitaciones</h3>
            {habitaciones.map((h, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 40px', gap: 8, marginBottom: 12 }}>
                <input type="text" placeholder="Nombre" value={h.nombre} onChange={e => updateHabitacion(i, 'nombre', e.target.value)} style={{ ...globalStyles.input, fontSize: 14 }} required />
                <input type="number" placeholder="Cap." value={h.capacidad} onChange={e => updateHabitacion(i, 'capacidad', parseInt(e.target.value) || 2)} style={{ ...globalStyles.input, fontSize: 14 }} min={1} />
                <input type="number" placeholder="Precio" value={h.precio} onChange={e => updateHabitacion(i, 'precio', parseFloat(e.target.value) || 0)} style={{ ...globalStyles.input, fontSize: 14 }} min={0} />
                <button type="button" onClick={() => removeHabitacion(i)} style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: 4, fontSize: 16 }}>✕</button>
              </div>
            ))}
            <button type="button" onClick={addHabitacion} style={{ ...globalStyles.button, backgroundColor: '#EC4899', fontSize: 14, padding: '6px 12px', marginBottom: 16 }}>
              + Agregar Habitación
            </button>
            <div style={{ ...adminStyles.gap12 }}>
              <button type="submit" disabled={formLoading} style={{ ...globalStyles.button, backgroundColor: formLoading ? '#6B7280' : colors.primary, flex: 1 }}>
                {formLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" onClick={resetForm} style={{ ...globalStyles.button, backgroundColor: '#6B7280', flex: 1 }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: colors.textMuted }}>Cargando...</p>
      ) : establecimientos.length === 0 ? (
        <p style={{ color: colors.textMuted }}>No hay establecimientos.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {establecimientos.map(e => (
            <div key={e.id} style={adminStyles.listItem}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: colors.primary }}>{e.nombre}</p>
                <p style={{ fontSize: 13, color: colors.textMuted }}>{e.tipo} • {e.municipio}</p>
                {e.cover_image && (
                  <img src={e.cover_image} alt="Cover" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4, marginTop: 8 }} />
                )}
              </div>
              <div style={{ ...adminStyles.gap12 }}>
                <button onClick={() => openEditForm(e)} style={{ ...globalStyles.buttonSmall, backgroundColor: '#3B82F6' }}>
                  Editar
                </button>
                <button onClick={() => deleteEstablecimiento(e.id, e.nombre)} style={{ ...globalStyles.buttonSmall, backgroundColor: '#EF4444' }}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Dashboard principal
// ------------------------------------------------------------------
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut, userMetadata } = useAuth();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!user || userMetadata === undefined) return;
    if (userMetadata?.rol !== 'admin') {
      navigate('/');
      return;
    }
    fetchAllData();
  }, [user, userMetadata, navigate]);

  const [stats, setStats] = useState({ usuarios: 0, cuponesVendidos: 0, ingresos: 0, establecimientos: 0 });
  const [ventasMensuales, setVentasMensuales] = useState([]);
  const [topEstablecimientos, setTopEstablecimientos] = useState([]);
  const [distribucionTipos, setDistribucionTipos] = useState([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllData = async () => {
    try {
      const [{ count: usuarios }, { data: cuponesVendidosData }, { count: establecimientos }] = await Promise.all([
        supabase.from('usuarios').select('id', { count: 'exact', head: true }).eq('rol', 'cliente'),
        supabase.from('cupones').select('precio_cupon, redeemed_at').eq('status', 'sold'),
        supabase.from('establecimientos').select('*', { count: 'exact', head: true }).eq('status', 'activo')
      ]);
      const cuponesVendidos = cuponesVendidosData?.length || 0;
      const ingresos = cuponesVendidosData?.reduce((acc, c) => acc + c.precio_cupon, 0) || 0;
      const ventasPorMes = {};
      cuponesVendidosData?.forEach(v => {
        const mes = new Date(v.redeemed_at).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
        ventasPorMes[mes] = (ventasPorMes[mes] || 0) + v.precio_cupon;
      });
      const ventasMensuales = Object.entries(ventasPorMes).map(([mes, total]) => ({ mes, total }));
      const { data: topEstData } = await supabase
        .from('cupones')
        .select('establecimiento_id, establecimientos(nombre)')
        .eq('status', 'sold');
      const countMap = topEstData?.reduce((acc, c) => {
        acc[c.establecimiento_id] = (acc[c.establecimiento_id] || 0) + 1;
        return acc;
      }, {});
      const topEstablecimientos = Object.entries(countMap || {})
        .map(([id, ventas]) => ({
          nombre: topEstData.find(e => e.establecimiento_id === id)?.establecimientos?.nombre || 'Desconocido',
          ventas
        }))
        .sort((a, b) => b.ventas - a.ventas)
        .slice(0, 5);
      const { data: tiposData } = await supabase
        .from('establecimientos')
        .select('tipo')
        .eq('status', 'activo');
      const tipoCount = tiposData?.reduce((a, e) => {
        a[e.tipo] = (a[e.tipo] || 0) + 1;
        return a;
      }, {});
      const distribucionTipos = Object.entries(tipoCount || {}).map(([name, value]) => ({ name, value }));
      setStats({ usuarios: usuarios || 0, cuponesVendidos, ingresos, establecimientos: establecimientos || 0 });
      setVentasMensuales(ventasMensuales.length > 0 ? ventasMensuales : [{ mes: 'Sin datos', total: 0 }]);
      setTopEstablecimientos(topEstablecimientos);
      setDistribucionTipos(distribucionTipos);
    } catch (err) {
      console.error(err);
      setStats({ usuarios: 0, cuponesVendidos: 0, ingresos: 0, establecimientos: 0 });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const modules = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'establecimientos', label: 'Establecimientos', icon: '🏨' },
    { id: 'usuarios', label: 'Usuarios / Proveedores', icon: '👥' },
    { id: 'cupones', label: 'Cupones', icon: '🎟️' }
  ];

  const COLORS = ['#C084FC', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#3B82F6'];

  return (
    <div style={adminStyles.adminContainer}>
      <header style={adminStyles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 'bold', color: colors.primary, margin: 0 }}>Admin Panel</h1>
        </div>
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(192,132,252,0.15)', padding: '8px 16px', borderRadius: 20, border: `1px solid ${colors.border}`, color: colors.primary, cursor: 'pointer', fontWeight: 'bold' }}>
            <UserIcon />
            <span>{userMetadata?.alias || 'Admin'}</span>
          </button>
          {showUserMenu && (
            <div style={{ position: 'absolute', top: 60, right: 0, background: '#1a1a2e', borderRadius: 16, padding: '12px 0', minWidth: 200, boxShadow: '0 15px 40px rgba(0,0,0,0.6)', border: `1px solid ${colors.border}` }}>
              <button onClick={handleSignOut} style={{ width: '100%', textAlign: 'left', padding: '12px 24px', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 'bold' }}>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <div style={{ display: 'flex', marginTop: 64 }}>
        <aside style={adminStyles.sidebar}>
          {modules.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: activeModule === m.id ? 'rgba(192,132,252,0.15)' : 'transparent',
                borderLeft: activeModule === m.id ? '4px solid #C084FC' : '4px solid transparent',
                color: activeModule === m.id ? '#C084FC' : '#94A3B8',
                fontWeight: activeModule === m.id ? 'bold' : 'normal',
                textAlign: 'left',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 15
              }}
            >
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </aside>

        <main style={adminStyles.mainContent}>
          {activeModule === 'dashboard' && (
            <ErrorBoundary>
              <DashboardHome />
            </ErrorBoundary>
          )}
          {activeModule === 'establecimientos' && (
            <ErrorBoundary>
              <ListaEstablecimientos />
            </ErrorBoundary>
          )}
          {activeModule === 'usuarios' && (
            <ErrorBoundary>
              <ListaUsuariosProveedores user={user} />
            </ErrorBoundary>
          )}
          {activeModule === 'cupones' && (
            <ErrorBoundary>
              <GestionCupones />
            </ErrorBoundary>
          )}
        </main>
      </div>
    </div>
  );
}
// src/components/TarjetaCupon.js
import React from 'react';
import { colors } from '../styles/globalStyles';

// ===== ESTILOS LOCALES =====
const tarjetaStyles = {
  container: {
    background: 'rgba(25, 25, 40, 0.9)',
    borderRadius: 16,
    border: '1px solid rgba(192, 132, 252, 0.25)',
    overflow: 'hidden',
    transition: 'all 0.25s ease',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.35)'
  },
  cover: {
    width: '100%',
    height: 120,
    backgroundColor: '#1a1a2e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    fontSize: 12
  },
  coverImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  content: {
    padding: 16
  },
  statusBadge: (bg, color) => ({
    display: 'inline-block',
    backgroundColor: bg,
    color: color,
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12
  }),
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    margin: '0 0 10px',
    lineHeight: 1.3
  },
  subtitle: {
    fontSize: 14,
    color: '#c7d2fe',
    margin: '0 0 6px',
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  location: {
    fontSize: 12,
    color: '#94a3b8',
    margin: '0 0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  roomCard: {
    background: 'rgba(30, 30, 50, 0.7)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14
  },
  roomTitle: {
    fontSize: 14,
    color: '#e2e8f0',
    margin: '0 0 4px',
    fontWeight: '600'
  },
  roomDetail: {
    fontSize: 12,
    color: '#94a3b8',
    margin: 0
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f472b6',
    margin: '10px 0'
  },
  codeBox: {
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px dashed #0ea5e9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12
  },
  codeLabel: {
    fontSize: 12,
    color: '#bae6fd',
    margin: '0 0 4px',
    fontWeight: '600'
  },
  codeValue: {
    fontSize: 15,
    color: '#f0f9ff',
    margin: 0,
    fontWeight: 'bold',
    letterSpacing: 1.5
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
    margin: '6px 0'
  }
};

// ===== MAPPING DE ESTADOS =====
const getStatusInfo = (status) => {
  const map = {
    onSale:   { label: 'En venta',    bg: 'rgba(192, 132, 252, 0.2)',  color: '#C084FC' },
    sold:     { label: 'Vendido',     bg: 'rgba(59, 130, 246, 0.2)',   color: '#3B82F6' },
    redeemed: { label: 'Canjeado',    bg: 'rgba(16, 185, 129, 0.2)',   color: '#10B981' },
    expired:  { label: 'Expirado',    bg: 'rgba(239, 68, 68, 0.2)',    color: '#EF4444' }
  };
  return map[status] || { label: status, bg: 'rgba(156, 163, 175, 0.2)', color: '#9CA3AF' };
};

// ===== COMPONENTE =====
export default function TarjetaCupon({ cupon, onClick }) {
  const statusInfo = getStatusInfo(cupon.status);

  return (
    <div
      style={{
        ...tarjetaStyles.container,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 10px 24px rgba(192, 132, 252, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.35)';
      }}
    >
      {/* Imagen de portada */}
      {cupon.establecimientos?.cover_image ? (
        <div style={tarjetaStyles.cover}>
          <img
            src={cupon.establecimientos.cover_image}
            alt={cupon.establecimientos.nombre}
            style={tarjetaStyles.coverImg}
            onError={(e) => {
              e.target.style.display = 'none';
              e.currentTarget.textContent = '📷 Imagen no disponible';
              e.currentTarget.style.display = 'flex';
            }}
          />
        </div>
      ) : (
        <div style={tarjetaStyles.cover}>
          📷 Sin imagen del establecimiento
        </div>
      )}

      <div style={tarjetaStyles.content}>
        {/* Estado */}
        <span style={tarjetaStyles.statusBadge(statusInfo.bg, statusInfo.color)}>
          {statusInfo.label}
        </span>

        {/* Nombre del cupón */}
        <h3 style={tarjetaStyles.title}>{cupon.nombre_cupon || 'Cupón sin nombre'}</h3>

        {/* Establecimiento */}
        {cupon.establecimientos?.nombre && (
          <p style={tarjetaStyles.subtitle}>
            🏨 {cupon.establecimientos.nombre}
          </p>
        )}

        {/* Municipio */}
        {cupon.establecimientos?.municipio && (
          <p style={tarjetaStyles.location}>
            📍 {cupon.establecimientos.municipio}
          </p>
        )}

        {/* Habitación */}
        {cupon.habitaciones && (
          <div style={tarjetaStyles.roomCard}>
            <p style={tarjetaStyles.roomTitle}>🛏️ {cupon.habitaciones.nombre}</p>
            <p style={tarjetaStyles.roomDetail}>
              Capacidad: {cupon.habitaciones.capacidad || '—'} personas
            </p>
          </div>
        )}

        {/* Precio */}
        <p style={tarjetaStyles.price}>
          ${cupon.precio_cupon?.toLocaleString('es-MX') || '—'}
        </p>

        {/* Código de redención (solo si está disponible y no expirado) */}
        {cupon.codigo_redencion && cupon.status !== 'expired' && (
          <div style={tarjetaStyles.codeBox}>
            <p style={tarjetaStyles.codeLabel}>Código de redención</p>
            <p style={tarjetaStyles.codeValue}>{cupon.codigo_redencion}</p>
          </div>
        )}

        {/* Fechas */}
        <p style={tarjetaStyles.dateText}>
          Válido: <strong>{new Date(cupon.validity_start).toLocaleDateString('es-MX')}</strong> al <strong>{new Date(cupon.validity_end).toLocaleDateString('es-MX')}</strong>
        </p>

        {/* Fecha de canje */}
        {cupon.redeemed_at && (
          <p style={{ ...tarjetaStyles.dateText, color: '#10B981' }}>
            ⏱️ Canjeado el {new Date(cupon.redeemed_at).toLocaleDateString('es-MX')}
          </p>
        )}
      </div>
    </div>
  );
}
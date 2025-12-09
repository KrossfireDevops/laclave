// src/components/MotelCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function MotelCard({ motel }) {
  const navigate = useNavigate();
  const handleViewCoupons = () => {
    // Opcional: navegar a /moteles/:id
    // Por ahora, llevamos a registro (coherente con tu flujo actual)
    navigate('/register');
  };

  return (
    <div
      key={motel.id}
      style={{
        minWidth: 240,
        backgroundColor: 'rgba(30, 30, 40, 0.7)',
        borderRadius: 16,
        overflow: 'hidden',
        flexShrink: 0,
        border: '1px solid rgba(192, 132, 252, 0.2)',
        transition: 'transform 0.2s, border-color 0.2s',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.5)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.2)';
      }}
    >
      {/* Imagen de portada */}
      <div style={{ height: 140, position: 'relative' }}>
        {motel.cover_image ? (
          <img
            src={motel.cover_image}
            alt={motel.nombre}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div style="width:100%;height:100%;background:#1F2937;display:flex;align-items:center;justify-content:center;color:#6B7280;font-size:12px;">
                    Sin imagen
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: '#1F2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
            fontSize: 12
          }}>
            Sin imagen
          </div>
        )}
      </div>

      {/* Contenido */}
      <div style={{ padding: 16, paddingTop: 12 }}>
        <h4 style={{
          color: '#E0E0FF',
          margin: 0,
          fontSize: 16,
          fontWeight: 'bold',
          minHeight: 24,
          display: 'flex',
          alignItems: 'center'
        }}>
          {motel.nombre}
        </h4>
        <p style={{
          color: '#FFD700',
          margin: '8px 0',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <span>⭐</span>
          {motel.rating ? motel.rating.toFixed(1) : '—'}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewCoupons();
          }}
          style={{
            marginTop: 10,
            backgroundColor: 'transparent',
            color: '#C084FC',
            border: '1px solid #C084FC',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 13,
            cursor: 'pointer',
            width: '100%',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#C084FC';
            e.target.style.color = 'white';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#C084FC';
          }}
        >
          Ver cupones
        </button>
      </div>
    </div>
  );
}
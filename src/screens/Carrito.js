import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function Carrito() {
  const navigate = useNavigate();
  const { currentUser, accessToken } = useAuth();

  const [carritoItems, setCarritoItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [metodoPago, setMetodoPago] = useState(null);
  const [ordenPago, setOrdenPago] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [telefonoValidado, setTelefonoValidado] = useState(false);
  const [mostrarComprobante, setMostrarComprobante] = useState(false);

  const countdownRef = useRef(null);
  const barcodeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, []);

  // ✅ Generar código de barras con JsBarcode cuando se muestra el comprobante
  useEffect(() => {
    if (mostrarComprobante && ordenPago?.referencia && barcodeRef.current) {
      const existingScript = document.getElementById('jsbarcode-script');
      const generateBarcode = () => {
        try {
          window.JsBarcode(barcodeRef.current, ordenPago.referencia, {
            format: 'CODE128',
            width: 2.5,
            height: 80,
            displayValue: false,
            margin: 0,
            background: '#ffffff',
            lineColor: '#000000',
          });
        } catch (e) {
          console.error('Error generando código de barras:', e);
        }
      };

      if (window.JsBarcode) {
        generateBarcode();
      } else if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'jsbarcode-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.6/JsBarcode.all.min.js';
        script.onload = generateBarcode;
        document.head.appendChild(script);
      }
    }
  }, [mostrarComprobante, ordenPago]);

  const fetchCarrito = useCallback(async () => {
    if (!currentUser?.id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('carritos')
        .select(`
          id,
          cupon_id,
          cupones (
            id,
            nombre_cupon,
            precio_cupon,
            establecimientos (nombre, municipio)
          )
        `)
        .eq('usuario_id', currentUser.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCarritoItems(data || []);
    } catch (err) {
      console.error('Error al cargar carrito:', err);
      setPaymentError('No se pudo cargar tu carrito. Por favor, recarga la página.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchCarrito(); }, [fetchCarrito]);

  const calcularTotal = () =>
    carritoItems.reduce((total, item) => total + (item.cupones?.precio_cupon || 0), 0);

  // ✅ Eliminar cupón y revertir reserva
  const eliminarDelCarrito = async (carritoItemId) => {
    setEliminandoId(carritoItemId);
    try {
      const item = carritoItems.find(i => i.id === carritoItemId);

      const { error } = await supabase
        .from('carritos')
        .delete()
        .eq('id', carritoItemId)
        .eq('usuario_id', currentUser.id);

      if (error) throw error;

      // Revertir reserva del cupón a onSale
      if (item?.cupon_id) {
        await supabase
          .from('cupones')
          .update({ status: 'onSale' })
          .eq('id', item.cupon_id)
          .eq('status', 'reserved');
      }

      setCarritoItems(prev => prev.filter(i => i.id !== carritoItemId));
    } catch (err) {
      console.error('Error al eliminar cupón:', err);
      alert('No se pudo eliminar el cupón. Intenta de nuevo.');
    } finally {
      setEliminandoId(null);
    }
  };

  const validarRespuestaPago = (data) => {
    if (!data?.orden_id || !data?.monto_total || !data?.expires_at) {
      throw new Error('El servidor de pagos respondió con datos incompletos');
    }
    return true;
  };

  const actualizarTelefono = async () => {
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length < 10) { alert('Ingresa un número de teléfono válido (mínimo 10 dígitos)'); return; }
    setUpdatingPhone(true);
    try {
      const { error } = await supabase.from('usuarios').update({ telefono: cleanPhone }).eq('id', currentUser.id);
      if (error) throw error;
      setTelefonoValidado(true);
      setShowPhoneModal(false);
      setPhoneInput('');
      if (metodoPago) await iniciarPago(metodoPago, true);
    } catch (err) {
      console.error('Error al actualizar teléfono:', err);
      alert('No se pudo actualizar tu teléfono. Intenta de nuevo.');
    } finally {
      setUpdatingPhone(false);
    }
  };

  const iniciarPago = async (metodo, esReintento = false) => {
    if (carritoItems.length === 0) { setPaymentError('Tu carrito está vacío.'); return; }
    if (!esReintento && !currentUser?.telefono && !telefonoValidado) {
      setMetodoPago(metodo); setShowPhoneModal(true); return;
    }

    setMetodoPago(metodo);
    setProcesandoPago(true);
    setPaymentError(null);

    try {
      console.log('Iniciando pago:', metodo);
      console.log('accessToken existe:', !!accessToken);
      console.log('currentUser.id:', currentUser?.id);

      if (!accessToken) throw new Error('Sesión no válida. Por favor, inicia sesión de nuevo.');

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      if (!supabaseUrl) throw new Error('Configuración incompleta.');

      const edgeFuncName = process.env.REACT_APP_EDGE_FUNCTION_CREATE_ORDER || 'create-conekta-order';
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/${edgeFuncName}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({
          usuario_id: currentUser.id,
          carrito_ids: carritoItems.map(item => item.id),
          metodo_pago: metodo
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('HTTP status:', response.status);

      if (!response.ok) {
        let errorMsg = 'Error al procesar el pago';
        try { const d = await response.json(); errorMsg = d.error || errorMsg; } catch { errorMsg = await response.text().catch(() => errorMsg); }
        throw new Error(`${response.status}: ${errorMsg}`);
      }

      const data = await response.json();
      console.log('Respuesta Edge Function:', data);
      validarRespuestaPago(data);

      // Enriquecer con datos del carrito para el comprobante
      const datosEnriquecidos = {
        ...data,
        items: carritoItems.map(item => ({
          nombre: item.cupones?.nombre_cupon,
          establecimiento: item.cupones?.establecimientos?.nombre,
          municipio: item.cupones?.establecimientos?.municipio,
          precio: item.cupones?.precio_cupon,
        })),
        fecha_generacion: new Date().toLocaleString('es-MX', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      };

      setOrdenPago(datosEnriquecidos);
      startCountdown(new Date(data.expires_at));

    } catch (err) {
      console.error('Error en iniciarPago:', err);
      let msg = 'Hubo un problema al procesar tu pago.';
      if (err.name === 'AbortError') msg = 'La solicitud tardó demasiado. Verifica tu conexión.';
      else if (err.message?.includes('Failed to fetch')) msg = 'No se pudo conectar con el servidor de pagos.';
      else if (err.message?.includes('Sesión no válida')) { msg = 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.'; setTimeout(() => navigate('/'), 3000); }
      else msg = `${err.message || msg}`;
      setPaymentError(msg);
      setProcesandoPago(false);
      setMetodoPago(null);
    } finally {
      if (!ordenPago) setProcesandoPago(false);
    }
  };

  const startCountdown = (expiresAt) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    const update = () => {
      const diff = expiresAt - new Date();
      if (diff <= 0) {
        clearInterval(countdownRef.current);
        setOrdenPago(prev => prev ? { ...prev, status: 'expired', time_left: '00:00:00' } : null);
        setPaymentError('Tu tiempo para pagar ha expirado. Por favor, inicia una nueva compra.');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const tl = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      setOrdenPago(prev => prev ? { ...prev, time_left: tl } : null);
    };
    countdownRef.current = setInterval(update, 1000);
    update();
  };

  const cancelarPago = () => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setMetodoPago(null); setOrdenPago(null); setPaymentError(null);
    setProcesandoPago(false); setMostrarComprobante(false);
  };

  const volverAlHome = () => { cancelarPago(); navigate('/'); };

  // ====================== COMPONENTE COMPROBANTE OXXO ======================
  const ComprobanteOxxo = ({ orden }) => (
    <div style={{
      backgroundColor: '#ffffff', borderRadius: 16, width: '100%',
      maxWidth: 480, margin: '0 auto', overflow: 'hidden',
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #0f0f1b 60%, #1a0520 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #C2185B' }}>
        <img src="/icon-512.png" alt="LaClave" style={{ height: 52, width: 52, objectFit: 'contain' }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#C2185B', fontSize: 24, fontWeight: 900, letterSpacing: 1 }}>LaClave</div>
          <div style={{ color: '#F4C842', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Comprobante de Pago</div>
        </div>
      </div>

      {/* Banda OXXO */}
      <div style={{ background: '#F7B500', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🏪</span>
        <span style={{ fontWeight: 900, fontSize: 14, color: '#1a1a1a', letterSpacing: 0.5 }}>
          Paga en OXXO o 7-Eleven · Solo Efectivo
        </span>
      </div>

      <div style={{ padding: '20px 24px' }}>

        {/* Monto */}
        <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, #fdf0ff, #fff0f8)', borderRadius: 12, padding: '18px 16px', marginBottom: 18, border: '2px solid #E879A0' }}>
          <div style={{ color: '#9B2C6F', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Total a pagar</div>
          <div style={{ color: '#C2185B', fontSize: 42, fontWeight: 900, lineHeight: 1 }}>
            ${orden.monto_total?.toLocaleString('es-MX')}
            <span style={{ fontSize: 16, fontWeight: 600 }}> MXN</span>
          </div>
        </div>

        {/* Cupones */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Cupones incluidos</div>
          {orden.items?.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: idx < orden.items.length - 1 ? '1px dashed #E5E7EB' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937', marginBottom: 2 }}>{item.nombre}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{item.establecimiento}{item.municipio ? ` · ${item.municipio}` : ''}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#C2185B', marginLeft: 12 }}>${item.precio?.toLocaleString('es-MX')}</div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '2px dashed #E5E7EB', margin: '0 0 18px' }} />

        {/* Referencia + Código de barras */}
        <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '16px', border: '1px solid #E5E7EB', marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 6 }}>Número de referencia</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#1F2937', letterSpacing: 3, textAlign: 'center', marginBottom: 14, fontVariantNumeric: 'tabular-nums' }}>
            {orden.referencia}
          </div>
          {/* Código de barras SVG */}
          <div style={{ display: 'flex', justifyContent: 'center', background: '#fff', borderRadius: 8, padding: '12px 8px', border: '1px solid #E5E7EB' }}>
            <svg ref={barcodeRef} style={{ maxWidth: '100%', height: 'auto' }}></svg>
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>
            Muestra este código al cajero para escanear desde tu celular
          </div>
        </div>

        {/* Vigencia */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFF7ED', borderRadius: 10, padding: '12px 16px', border: '1px solid #FED7AA', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: '#92400E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Vigencia</div>
            <div style={{ fontSize: 12, color: '#78350F', fontWeight: 600, marginTop: 2 }}>15 min desde la generación</div>
          </div>
          {orden.time_left && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#92400E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Tiempo restante</div>
              <div style={{ fontSize: 20, color: '#B91C1C', fontWeight: 900, marginTop: 2 }}>{orden.time_left}</div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>Generado el {orden.fecha_generacion}</div>
        <div style={{ textAlign: 'center', fontSize: 10, color: '#9CA3AF' }}>Orden: {orden.orden_id}</div>
      </div>

      {/* Footer */}
      <div style={{ background: '#F3F4F6', padding: '12px 24px', borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>
          Al pagar recibirás tus cupones por correo electrónico.<br />
          Soporte: <span style={{ color: '#C2185B', fontWeight: 600 }}>laclave.mx</span>
        </div>
      </div>
    </div>
  );

  // ====================== RENDER ======================

  if (paymentError) {
    return (
      <div style={{ backgroundColor: '#0F0F1B', minHeight: '100vh', padding: '20px', color: '#E0E0FF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: '80px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: '#EF4444', marginBottom: 8 }}>Error en el pago</h2>
        <p style={{ color: '#9CA3AF', marginBottom: 24, maxWidth: 400 }}>{paymentError}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => { setPaymentError(null); if (metodoPago) iniciarPago(metodoPago); }} disabled={procesandoPago}
            style={{ background: 'linear-gradient(135deg, #C084FC, #A855F7)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: procesandoPago ? 'not-allowed' : 'pointer' }}>
            🔄 Reintentar
          </button>
          <button onClick={volverAlHome}
            style={{ background: 'rgba(156,163,175,0.2)', color: '#9CA3AF', border: '1px solid rgba(156,163,175,0.3)', padding: '12px 24px', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>
            🏠 Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Pantalla 1: Carrito
  if (metodoPago === null && !ordenPago && !showPhoneModal) {
    return (
      <div style={{ backgroundColor: '#0F0F1B', minHeight: '100vh', padding: '20px', color: '#E0E0FF', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '600px', marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(192,132,252,0.15)', border: '2px solid rgba(192,132,252,0.3)', color: '#C084FC', cursor: 'pointer' }}>←</button>
          <h1 style={{ color: '#C084FC', fontSize: 28, margin: 0, flex: 1, textAlign: 'center' }}>Tu Carrito</h1>
          <div style={{ width: 44 }} />
        </div>

        {carritoItems.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🧺</div>
            <p style={{ fontSize: 18, color: '#9CA3AF' }}>Tu carrito está vacío</p>
            <button onClick={() => navigate('/')} style={{ marginTop: 24, background: 'linear-gradient(135deg, #C084FC, #A855F7)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 12, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>
              Explorar cupones
            </button>
          </div>
        ) : (
          <>
            <div style={{ backgroundColor: 'rgba(30,30,40,0.7)', borderRadius: 16, padding: 24, width: '100%', maxWidth: '600px', marginBottom: 24, border: '1px solid rgba(192,132,252,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(192,132,252,0.2)' }}>
                <span style={{ fontSize: 16, color: '#9CA3AF' }}>Total ({carritoItems.length} cupón{carritoItems.length !== 1 ? 'es' : ''}):</span>
                <span style={{ color: '#C084FC', fontSize: 28, fontWeight: 'bold' }}>${calcularTotal().toLocaleString('es-MX')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {carritoItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'rgba(192,132,252,0.05)', borderRadius: 12, border: '1px solid rgba(192,132,252,0.1)', opacity: eliminandoId === item.id ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 'bold', color: '#E0E0FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '260px' }}>
                        {item.cupones?.nombre_cupon || 'Cupón'}
                      </p>
                      {item.cupones?.establecimientos?.nombre && (
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>
                          {item.cupones.establecimientos.nombre}{item.cupones.establecimientos.municipio ? ` · ${item.cupones.establecimientos.municipio}` : ''}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <span style={{ color: '#C084FC', fontWeight: 'bold', fontSize: 15 }}>${item.cupones?.precio_cupon?.toLocaleString('es-MX')}</span>
                      <button onClick={() => eliminarDelCarrito(item.id)} disabled={eliminandoId === item.id || procesandoPago}
                        style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', cursor: eliminandoId === item.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                        {eliminandoId === item.id ? '⏳' : '×'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: '600px' }}>
              {['oxxo', 'codi'].map((metodo) => (
                <button key={metodo} onClick={() => iniciarPago(metodo)} disabled={procesandoPago}
                  style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)', border: metodo === 'oxxo' ? '2px solid #F7B500' : '2px solid #38BDF8', color: metodo === 'oxxo' ? '#F7B500' : '#38BDF8', padding: '24px', borderRadius: 20, fontSize: 18, fontWeight: 'bold', cursor: procesandoPago ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: procesandoPago ? 0.7 : 1, position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }}>
                  {metodo === 'oxxo' ? '🏪 Pagar en OXXO o 7-Eleven' : '📱 Pagar con CoDi'}
                  {procesandoPago && (<span style={{ position: 'absolute', right: 20, display: 'inline-block', width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid currentColor', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />)}
                </button>
              ))}
            </div>
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Pantalla 2: OXXO con comprobante
  if (ordenPago && metodoPago === 'oxxo') {
    return (
      <div style={{ backgroundColor: '#0F0F1B', minHeight: '100vh', padding: '20px', color: '#E0E0FF', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '32px', paddingBottom: '40px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 480, marginBottom: 16 }}>
          <button onClick={cancelarPago} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)', color: '#EF4444', cursor: 'pointer', fontSize: 18 }}>✕</button>
          <h1 style={{ color: '#C084FC', fontSize: 18, margin: 0 }}>Comprobante de pago OXXO</h1>
          <div style={{ width: 44 }} />
        </div>

        {/* Toggle vista */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, width: '100%', maxWidth: 480 }}>
          <button onClick={() => setMostrarComprobante(false)}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontWeight: 'bold', fontSize: 13, cursor: 'pointer', background: !mostrarComprobante ? '#C084FC' : 'transparent', color: !mostrarComprobante ? 'white' : '#9CA3AF', transition: 'all 0.2s' }}>
            Vista rápida
          </button>
          <button onClick={() => setMostrarComprobante(true)}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontWeight: 'bold', fontSize: 13, cursor: 'pointer', background: mostrarComprobante ? '#F7B500' : 'transparent', color: mostrarComprobante ? '#1a1a1a' : '#9CA3AF', transition: 'all 0.2s' }}>
            🧾 Comprobante completo
          </button>
        </div>

        {!mostrarComprobante ? (
          <div style={{ backgroundColor: 'rgba(30,30,40,0.9)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 480, border: '2px solid rgba(247,181,0,0.4)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40, fontWeight: 'bold', color: '#F7B500' }}>${ordenPago.monto_total?.toLocaleString('es-MX')}</div>
            </div>
            {ordenPago.time_left && (
              <div style={{ textAlign: 'center', marginBottom: 20, color: '#EF4444', fontSize: 18 }}>⏱️ {ordenPago.time_left}</div>
            )}
            <div style={{ backgroundColor: '#000', borderRadius: 16, padding: 24, marginBottom: 20, textAlign: 'center' }}>
              <p style={{ color: '#F7B500', fontSize: 16, fontWeight: 'bold', margin: '0 0 8px' }}>Referencia OXXO</p>
              <p style={{ fontSize: 22, letterSpacing: 4, color: '#F7B500', margin: 0, fontWeight: 'bold' }}>{ordenPago.referencia}</p>
            </div>
            <button onClick={() => setMostrarComprobante(true)}
              style={{ width: '100%', padding: 14, background: '#F7B500', color: '#1a1a1a', border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 16, cursor: 'pointer', marginBottom: 12 }}>
              🧾 Ver comprobante con código de barras
            </button>
            <button onClick={cancelarPago}
              style={{ width: '100%', padding: 14, backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, cursor: 'pointer', fontWeight: 'bold' }}>
              Cancelar pago
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 480 }}>
            <ComprobanteOxxo orden={ordenPago} />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button onClick={() => window.print()}
                style={{ flex: 1, padding: 14, background: 'linear-gradient(135deg, #C084FC, #A855F7)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 14, cursor: 'pointer' }}>
                📸 Capturar / Guardar
              </button>
              <button onClick={cancelarPago}
                style={{ flex: 1, padding: 14, background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, fontWeight: 'bold', fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
            <p style={{ textAlign: 'center', color: '#6B7280', fontSize: 12, marginTop: 10 }}>
              📱 Toma una captura de pantalla para mostrar en tienda
            </p>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Pantalla 2b: CoDi
  if (ordenPago && metodoPago === 'codi') {
    return (
      <div style={{ backgroundColor: '#0F0F1B', minHeight: '100vh', padding: '20px', color: '#E0E0FF', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '600px', marginBottom: 24 }}>
          <button onClick={cancelarPago} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)', color: '#EF4444', cursor: 'pointer' }}>✕</button>
          <h1 style={{ color: '#C084FC', fontSize: 24, margin: 0, flex: 1, textAlign: 'center' }}>Escanea con CoDi</h1>
          <div style={{ width: 44 }} />
        </div>
        <div style={{ backgroundColor: 'rgba(30,30,40,0.9)', borderRadius: 24, padding: 28, width: '100%', maxWidth: '600px', border: '2px solid rgba(56,189,248,0.4)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 42, fontWeight: 'bold', color: '#38BDF8' }}>${ordenPago.monto_total?.toLocaleString('es-MX')}</div>
          </div>
          {ordenPago.time_left && (
            <div style={{ textAlign: 'center', marginBottom: 24, color: '#EF4444', fontSize: 20 }}>⏱️ {ordenPago.time_left}</div>
          )}
          <div style={{ backgroundColor: '#000', borderRadius: 16, padding: 24, marginBottom: 28 }}>
            {ordenPago.qr_url && <img src={ordenPago.qr_url} alt="QR CoDi" style={{ width: '100%', borderRadius: 12 }} />}
          </div>
          <button onClick={cancelarPago} style={{ width: '100%', padding: 16, backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: 16, fontSize: 16, cursor: 'pointer', fontWeight: 'bold' }}>
            Cancelar pago
          </button>
        </div>
      </div>
    );
  }

  // Modal teléfono
  if (showPhoneModal) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: 20 }} role="dialog" aria-modal="true">
        <div style={{ backgroundColor: '#1F2937', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', border: '1px solid rgba(192,132,252,0.4)', color: '#E0E0FF' }}>
          <h3 style={{ color: '#C084FC', margin: '0 0 16px', fontSize: 20 }}>📱 Completa tu perfil</h3>
          <p style={{ color: '#9CA3AF', marginBottom: 20, fontSize: 14, lineHeight: 1.5 }}>Para procesar tu pago de forma segura necesitamos tu número de teléfono.</p>
          <input type="tel" placeholder="Ej. 3312345678" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !updatingPhone && actualizarTelefono()}
            style={{ width: '100%', padding: '14px', borderRadius: 10, border: '1px solid rgba(192,132,252,0.4)', backgroundColor: 'rgba(30,30,40,0.9)', color: 'white', fontSize: 16, outline: 'none', marginBottom: 20, boxSizing: 'border-box' }} autoFocus />
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={actualizarTelefono} disabled={updatingPhone}
              style={{ flex: 1, padding: '12px', backgroundColor: updatingPhone ? '#6B7280' : '#10B981', color: 'white', border: 'none', borderRadius: 10, fontWeight: 'bold', cursor: updatingPhone ? 'not-allowed' : 'pointer', fontSize: 16 }}>
              {updatingPhone ? '⏳ Guardando...' : '✅ Continuar con pago'}
            </button>
            <button onClick={() => { setShowPhoneModal(false); setMetodoPago(null); navigate('/mis-cupones'); }} disabled={updatingPhone}
              style={{ flex: 1, padding: '12px', backgroundColor: 'rgba(156,163,175,0.2)', color: '#9CA3AF', border: '1px solid rgba(156,163,175,0.3)', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#0F0F1B', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 48, height: 48, border: '4px solid rgba(192,132,252,0.3)', borderTop: '4px solid #C084FC', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return null;
}
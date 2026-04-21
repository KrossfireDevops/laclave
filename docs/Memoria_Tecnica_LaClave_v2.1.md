# 🗝️ Memoria Técnica LaClave v2.1
## Plataforma de Publicidad y Cupones para Moteles, Bares y Centros Nocturnos
### Actualización: Funcionalidades de Reserva + Comprobante Profesional + Edge Function Robusta

📅 Fecha de generación: Abril 2026
👤 Autor: Rick (Desarrollador Lead)
🔄 Versión del documento: 2.1 (Actualización de v2.0)
🔗 Repositorio: C:\LaClave (local) → Vercel (producción)



---

## 📋 Tabla de Contenidos - Actualizaciones v2.1

1. [Resumen de Nuevas Funcionalidades](#1-resumen-de-nuevas-funcionalidades)
2. [Arquitectura de Reserva de Cupones](#2-arquitectura-de-reserva-de-cupones)
3. [Flujo de Pago Mejorado - Carrito.js](#3-flujo-de-pago-mejorado---carritojs)
4. [Comprobante OXXO Profesional con Código de Barras](#4-comprobante-oxxo-profesional-con-código-de-barras)
5. [Edge Function: create-conekta-order v2.0](#5-edge-function-create-conekta-order-v20)
6. [Prevención de Race Conditions](#6-prevención-de-race-conditions)
7. [UX: Estados Visuales en Tiempo Real](#7-ux-estados-visuales-en-tiempo-real)
8. [Variables de Entorno Actualizadas](#8-variables-de-entorno-actualizadas)
9. [Checklist de Validación v2.1](#9-checklist-de-validación-v21)

---

## 1. Resumen de Nuevas Funcionalidades

| Funcionalidad | Archivo | Impacto en UX/Negocio |
|--------------|---------|---------------------|
| 🔐 **Reserva inmediata de cupones** | `CuponesMarketplace.js` | Previene sobreventa: status `onSale` → `reserved` al agregar al carrito |
| 🔄 **Reversión de reserva al eliminar** | `Carrito.js` | Si usuario elimina del carrito, cupón vuelve a `onSale` para otros |
| 🧾 **Comprobante OXXO profesional** | `Carrito.js` + `ComprobanteOxxo` | Experiencia tipo ticket físico con código de barras escaneable |
| 📊 **Badge de carrito en tiempo real** | `CuponesMarketplace.js` | Usuario ve cuántos cupones tiene en carrito sin navegar |
| ⏳ **Estados visuales de botón** | Ambos archivos | "Agregando...", "✅ En carrito", "⏳ Reservando..." |
| 🔍 **Logging robusto en Edge Function** | `create-conekta-order/index.ts` | Debugging en producción con logs estructurados |
| 🌐 **CORS configurado correctamente** | Edge Function | Conexión estable desde localhost y producción |

---

## 2. Arquitectura de Reserva de Cupones

### Diagrama de Estados del Cupón
```mermaid
stateDiagram-v2
    [*] --> onSale: Cupón creado y publicado
    onSale --> reserved: Usuario agrega al carrito
    reserved --> onSale: Usuario elimina del carrito
    reserved --> pending_payment: Edge Function confirma orden
    pending_payment --> sold: Pago exitoso en OXXO/CoDi
    pending_payment --> onSale: Pago expirado (15 min)
    sold --> redeemed: Usuario canjea en establecimiento
    sold --> expired: Fecha de validez terminada

    Implementación en CuponesMarketplace.js
    // ✅ Paso 1: Verificar disponibilidad (doble check)
const {  cupon } = await supabase
  .from('cupones')
  .select('id, status')
  .eq('id', cuponId)
  .eq('status', 'onSale')  // ← Solo si aún está disponible
  .is('redeemed_at', null)
  .gte('validity_end', today)
  .maybeSingle();

// ✅ Paso 2: Reservar inmediatamente (atomic update)
const { error: reservaError } = await supabase
  .from('cupones')
  .update({ status: 'reserved' })
  .eq('id', cuponId)
  .eq('status', 'onSale');  // ← Condición adicional para evitar race conditions

// ✅ Paso 3: Agregar al carrito
await supabase.from('carritos').insert({ ... });

// ✅ Paso 4: Actualizar UI localmente
setAgregados(prev => new Set(prev).add(cuponId));
setCupones(prev => prev.filter(c => c.id !== cuponId)); // Ocultar del marketplace

Implementación en Carrito.js (Reversión)
const eliminarDelCarrito = async (carritoItemId) => {
  // 1. Eliminar del carrito
  await supabase.from('carritos').delete().eq('id', carritoItemId);
  
  // 2. Revertir reserva del cupón
  await supabase
    .from('cupones')
    .update({ status: 'onSale' })  // ← Vuelve a estar disponible
    .eq('id', item.cupon_id)
    .eq('status', 'reserved');     // ← Solo si aún está reservado (no fue pagado)
};

🔹 Clave de seguridad: La condición .eq('status', 'reserved') en el update previene que un cupón ya pagado (pending_payment o sold) sea revertido accidentalmente.

3. Flujo de Pago Mejorado - Carrito.js
Nuevos Estados y Manejo de Errores

// Estados agregados:
const [eliminandoId, setEliminandoId] = useState(null);        // Feedback al eliminar
const [paymentError, setPaymentError] = useState(null);        // Error accionable
const [mostrarComprobante, setMostrarComprobante] = useState(false); // Toggle vista comprobante

// Validación de sesión robusta:
if (!accessToken) throw new Error('Sesión no válida. Por favor, inicia sesión de nuevo.');

// Timeout de fetch para evitar bloqueos:
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

Enriquecimiento de Datos para Comprobante

// La Edge Function retorna datos básicos, el frontend enriquece:
const datosEnriquecidos = {
  ...data,  // orden_id, monto_total, referencia, etc.
  items: carritoItems.map(item => ({
    nombre: item.cupones?.nombre_cupon,
    establecimiento: item.cupones?.establecimientos?.nombre,
    municipio: item.cupones?.establecimientos?.municipio,
    precio: item.cupones?.precio_cupon,
  })),
  fecha_generacion: new Date().toLocaleString('es-MX', { /* formato legible */ })
};


4. Comprobante OXXO Profesional con Código de Barras
Componente ComprobanteOxxo - Características
Elemento
Implementación
Propósito
🎨 Diseño tipo ticket físico
Gradientes, bordes, tipografía monoespaciada
Familiaridad para usuario en tienda
📊 Código de barras CODE128
Librería JsBarcode cargada dinámicamente
Escaneo rápido en caja OXXO/7-Eleven
⏱️ Contador de vigencia
Countdown sincronizado con Edge Function
Urgencia para completar pago
📱 Toggle vista rápida/completa
Botones para alternar entre resumen y ticket
UX adaptable a contexto de uso
🖨️ Botón "Capturar / Guardar"
window.print() optimizado para móvil
Usuario guarda comprobante en galería
Implementación del Código de Barras

Implementación del Código de Barras
// Carga dinámica de JsBarcode (solo cuando se necesita)
useEffect(() => {
  if (mostrarComprobante && ordenPago?.referencia && barcodeRef.current) {
    if (window.JsBarcode) {
      generateBarcode();
    } else {
      // Cargar script desde CDN si no existe
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.6/JsBarcode.all.min.js';
      script.onload = generateBarcode;
      document.head.appendChild(script);
    }
  }
}, [mostrarComprobante, ordenPago]);

Diseño Responsive del Comprobante
/* El comprobante está optimizado para:
   - Móvil: ancho completo, scroll vertical
   - Desktop: centrado, máximo 480px (tamaño ticket real)
   - Impresión: media query para ocultar botones y ajustar márgenes
*/

5. Edge Function: create-conekta-order v2.0
Mejoras Clave Implementadas
✅ Logging Estructurado para Debugging

console.log('INICIO - metodo:', req.method);
console.log('AUTH header presente:', !!req.headers.get('Authorization'));
console.log('BODY recibido:', JSON.stringify(body));
// ... logs en cada paso crítico

🔹 Beneficio: En Supabase Dashboard → Edge Functions → Logs, puedes ver el flujo completo de cada petición.
✅ Validación de Token con Supabase Auth


// Usar anon key para validar token de usuario (no service role)
const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: 'Bearer ' + token } }
});
const {  { user }, error: authError } = await supabaseUser.auth.getUser();

🔹 Seguridad: Validar que user.id === usuario_id previene que un usuario manipule requests para pagar cupones de otros.
✅ Manejo de Errores Detallado

} catch (error) {
  console.log('EXCEPCION CAPTURADA:', error.message);
  console.log('STACK:', error.stack);  // ← Crucial para debug en producción
  return new Response(JSON.stringify({
    error: 'Error interno del servidor',
    details: error.message  // ← Solo en desarrollo; en prod ocultar detalles sensibles
  }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

✅ CORS Configurado Correctamente
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // ← Permitir localhost y producción
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Respuesta a preflight OPTIONS con status 204 (crítico para navegadores)
if (req.method === 'OPTIONS') {
  return new Response(null, { status: 204, headers: corsHeaders });
}


6. Prevención de Race Conditions
Problema Resuelto: Doble Click / Múltiples Tabs
Escenario
Solución Implementada
Usuario hace doble clic en "Agregar"
Estado agregando: Set<string> deshabilita botón mientras procesa
Usuario tiene 2 tabs abiertas del marketplace
Condición .eq('status', 'onSale') en update de reserva previene sobre-reserva
Usuario elimina cupón mientras se procesa pago
Condición .eq('status', 'reserved') en reversión previene revertir cupón ya pagado
Edge Function tarda >30s en responder
AbortController con timeout evita bloqueos infinitos en frontend

Código Clave: Atomic Update con Condición
-- En la Edge Function (Supabase PostgreSQL):
UPDATE cupones 
SET status = 'reserved' 
WHERE id = 'cupon-123' 
  AND status = 'onSale';  -- ← Esta condición hace que el update sea atómico

  Si otro request ya cambió el status a reserved o pending_payment, este update no afectará filas → el frontend detecta 0 filas afectadas y muestra error amigable.


7. UX: Estados Visuales en Tiempo Real
En CuponesMarketplace.js

// Tres estados del botón "Agregar":
{estaAgregado 
  ? '✅ En carrito' 
  : estaAgregando 
    ? '⏳ Agregando...' 
    : 'Agregar'}

// Estilo condicional:
background: estaAgregado ? '#10B981'  // Verde: éxito
          : estaAgregando ? '#6B7280'  // Gris: procesando
          : '#C084FC'  // Morado: accionable


7. UX: Estados Visuales en Tiempo Real
En CuponesMarketplace.js
js
1234567891011
En Carrito.js
js
12345678
Badge de Carrito en Header
jsx
1234567891011
8. Variables de Entorno Actualizadas
.env.local (Desarrollo)
env
123456789101112131415
Secrets en Edge Function (Supabase Dashboard)
123
⚠️ Nunca commitear .env.local ni exponer SERVICE_ROLE_KEY en frontend.
9. Checklist de Validación v2.1
Funcionalidad de Reserva
Agregar cupón → status cambia a reserved en BD
Eliminar del carrito → status vuelve a onSale
Dos usuarios intentan agregar mismo cupón → solo uno logra reservar
Cupón reservado pero no pagado en 15 min → webhook o cron job lo revierte a onSale (pendiente implementar)
Comprobante OXXO
Código de barras se genera correctamente con JsBarcode
Referencia OXXO es legible y escaneable en tienda
Toggle vista rápida/completa funciona en móvil y desktop
window.print() genera PDF/ticket imprimible
Edge Function
Logs aparecen en Supabase Dashboard → Edge Functions → Logs
CORS permite requests desde http://localhost:3000 y https://laclavemx.com
Validación de token rechaza requests con usuario incorrecto
Timeout de 30s previene bloqueos por red lenta
UX / QA
Botones muestran estados "Agregando...", "✅ En carrito" sin parpadeos
Badge de carrito se actualiza sin recargar página
Eliminar cupón del carrito tiene feedback visual (opacity + spinner)
Mensajes de error son accionables: "Reintentar" / "Volver al inicio"
🗓️ Roadmap Post-v2.1
Inmediato (1 semana)
Webhook de Conekta: Actualizar status pending_payment → sold cuando pago sea confirmado en OXXO
Cron job: Revertir reservas reserved >15 min a onSale (prevención de cupones "huérfanos")
Tests E2E: Cypress para flujo completo: marketplace → carrito → pago → comprobante
Corto Plazo (2-3 semanas)
Notificaciones push: Avisar al usuario cuando su reserva está por expirar
Historial de pagos: En "Mis Cupones", mostrar órdenes pagadas con opción a re-imprimir comprobante
Analytics de conversión: Tracking de eventos: cupon_viewed, added_to_cart, payment_started, payment_completed
Largo Plazo (1-2 meses)
Modo offline: PWA para que proveedores puedan gestionar cupones sin conexión
Multi-idioma: Soporte para inglés/español en interfaz y comprobantes
Integración con wallets: Apple Pay / Google Pay como método de pago adicional
📎 Anexos Técnicos
Anexo A: Estructura de Respuesta de Edge Function
json
12345678
Anexo B: Estados de Cupón - Descripción Completa
Status
Descripción
Quién puede cambiarlo
Transición siguiente
onSale
Disponible para compra
Sistema / Proveedor
reserved (usuario agrega)
reserved
Reservado en carrito de usuario
Frontend (al agregar)
pending_payment (pago iniciado) o onSale (eliminado)
pending_payment
Orden creada, esperando pago
Edge Function
sold (webhook Conekta) o onSale (expirado)
sold
Pago confirmado, cupón activo
Webhook Conekta
redeemed (canje) o expired (fecha fin)
redeemed
Cupón canjeado en establecimiento
Proveedor vía dashboard
[*] (fin del ciclo)
expired
Fecha de validez terminada
Cron job / sistema
[*] (fin del ciclo)
Anexo C: Comandos de Deploy Actualizados
powershell
1234567891011121314
🗝️ LaClave v2.1 - Arquitectura de reservas + comprobante profesional + edge function robusta.
"Cada cupón reservado es una oportunidad convertida; cada error manejado es confianza ganada."
diff
123



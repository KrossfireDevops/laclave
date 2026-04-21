import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

// =====================================================
// LaClave - Webhook de Conekta
// Recibe eventos de pago y actualiza el estado de
// cupones automáticamente pending_payment → sold
// =====================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-conekta-digest',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Genera código de redención corto y legible: CLAVE-7X9K2
function generarCodigoRedencion() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = 'CLAVE-';
  for (let i = 0; i < 5; i++) {
    codigo += chars[Math.floor(Math.random() * chars.length)];
  }
  return codigo;
}

// Verifica la firma HMAC que Conekta envía en el header x-conekta-digest
async function verificarFirmaConekta(payload, firma, secret) {
  try {
    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    const firmaEsperada = hmac.digest('hex');
    return firmaEsperada === firma;
  } catch (e) {
    console.log('ERROR verificando firma:', e.message);
    return false;
  }
}

serve(async (req) => {
  console.log('WEBHOOK CONEKTA - metodo:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo no permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Leer body como texto para verificar firma antes de parsear
  const bodyText = await req.text();
  console.log('PAYLOAD recibido (200 chars):', bodyText.substring(0, 200));

  // ✅ Verificar firma HMAC de Conekta
  const webhookSecret = Deno.env.get('CONEKTA_WEBHOOK_SECRET');
  const firmaRecibida = req.headers.get('x-conekta-digest');

  if (webhookSecret && firmaRecibida) {
    const firmaValida = await verificarFirmaConekta(bodyText, firmaRecibida, webhookSecret);
    if (!firmaValida) {
      console.log('ERROR: Firma HMAC invalida - posible solicitud falsa');
      return new Response(JSON.stringify({ error: 'Firma invalida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('FIRMA HMAC verificada OK');
  } else {
    // En desarrollo sin secret configurado, solo advertir
    console.log('ADVERTENCIA: Webhook secret no configurado - saltando verificacion de firma');
  }

  // Parsear evento
  let evento;
  try {
    evento = JSON.parse(bodyText);
  } catch (e) {
    console.log('ERROR: Payload no es JSON valido');
    return new Response(JSON.stringify({ error: 'Payload invalido' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const tipoEvento = evento?.type;
  console.log('TIPO DE EVENTO:', tipoEvento);

  // Solo procesar eventos de pago completado
  // Conekta envía: order.paid para OXXO y CoDi
  if (tipoEvento !== 'order.paid') {
    console.log('EVENTO ignorado - no es order.paid');
    return new Response(JSON.stringify({ ok: true, mensaje: 'Evento no procesado: ' + tipoEvento }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Extraer datos del evento de Conekta
  const ordenConekta    = evento?.data?.object;
  const conektaOrderId  = ordenConekta?.id;
  const referencia      = ordenConekta?.charges?.data?.[0]?.payment_method?.reference;
  const montoConekta    = ordenConekta?.amount; // Conekta usa centavos

  console.log('CONEKTA ORDER ID:', conektaOrderId);
  console.log('REFERENCIA:', referencia);
  console.log('MONTO (centavos):', montoConekta);

  if (!conektaOrderId && !referencia) {
    console.log('ERROR: No se puede identificar la orden');
    return new Response(JSON.stringify({ error: 'Orden no identificable' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Inicializar cliente Supabase con service role
  const supabaseUrl        = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase           = createClient(supabaseUrl, supabaseServiceKey);

  // ✅ Buscar la orden en nuestra base de datos
  // Primero por conekta_order_id, si no por referencia
  let ordenQuery = supabase.from('ordenes').select('*');

  if (conektaOrderId) {
    ordenQuery = ordenQuery.eq('conekta_order_id', conektaOrderId);
  } else {
    ordenQuery = ordenQuery.eq('referencia', referencia);
  }

  const { data: ordenes, error: ordenError } = await ordenQuery.limit(1);

  if (ordenError || !ordenes?.length) {
    console.log('ERROR: Orden no encontrada en DB - conekta_id:', conektaOrderId, '- ref:', referencia);
    return new Response(JSON.stringify({ error: 'Orden no encontrada' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const orden = ordenes[0];
  console.log('ORDEN encontrada:', orden.orden_id, '- status actual:', orden.status);

  // Evitar procesar el mismo pago dos veces (idempotencia)
  if (orden.status === 'paid') {
    console.log('ORDEN ya estaba pagada - ignorando duplicado');
    return new Response(JSON.stringify({ ok: true, mensaje: 'Orden ya procesada' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ✅ Obtener cupones relacionados a esta orden
  const { data: ordenCupones, error: cuponesError } = await supabase
    .from('orden_cupones')
    .select('cupon_id')
    .eq('orden_id', orden.orden_id);

  if (cuponesError || !ordenCupones?.length) {
    console.log('ERROR: No se encontraron cupones para la orden:', orden.orden_id);
    return new Response(JSON.stringify({ error: 'Cupones de orden no encontrados' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const cuponIds = ordenCupones.map(oc => oc.cupon_id);
  console.log('CUPONES a actualizar:', cuponIds.length, cuponIds);

  // ✅ Actualizar cada cupón individualmente con su código de redención único
  const ahora = new Date().toISOString();
  const erroresCupones = [];

  for (const cuponId of cuponIds) {
    // Generar código único verificando que no exista
    let codigoRedencion;
    let intentos = 0;
    while (intentos < 5) {
      const candidato = generarCodigoRedencion();
      const { data: existente } = await supabase
        .from('cupones')
        .select('id')
        .eq('codigo_redencion', candidato)
        .maybeSingle();

      if (!existente) {
        codigoRedencion = candidato;
        break;
      }
      intentos++;
    }

    if (!codigoRedencion) {
      console.log('ERROR: No se pudo generar codigo unico para cupon:', cuponId);
      erroresCupones.push(cuponId);
      continue;
    }

    const { error: updateError } = await supabase
      .from('cupones')
      .update({
        status:           'sold',
        comprado_por:     orden.usuario_id,
        codigo_redencion: codigoRedencion,
        updated_at:       ahora,
      })
      .eq('id', cuponId)
      .eq('status', 'pending_payment'); // solo si sigue en pending (seguridad extra)

    if (updateError) {
      console.log('ERROR actualizando cupon:', cuponId, '-', updateError.message);
      erroresCupones.push(cuponId);
    } else {
      console.log('CUPON actualizado a sold:', cuponId, '- codigo:', codigoRedencion);
    }
  }

  // ✅ Actualizar la orden a pagada
  const { error: updateOrdenError } = await supabase
    .from('ordenes')
    .update({
      status:           'paid',
      conekta_order_id: conektaOrderId,
      paid_at:          ahora,
      webhook_payload:  evento,
      updated_at:       ahora,
    })
    .eq('orden_id', orden.orden_id);

  if (updateOrdenError) {
    console.log('ERROR actualizando orden:', updateOrdenError.message);
  } else {
    console.log('ORDEN actualizada a paid:', orden.orden_id);
  }

  // ✅ Limpiar el carrito del usuario
  const { error: carritoError } = await supabase
    .from('carritos')
    .delete()
    .eq('usuario_id', orden.usuario_id)
    .in('cupon_id', cuponIds);

  if (carritoError) {
    console.log('ERROR limpiando carrito:', carritoError.message);
  } else {
    console.log('CARRITO limpiado para usuario:', orden.usuario_id);
  }

  const resultado = {
    ok:              true,
    orden_id:        orden.orden_id,
    cupones_activos: cuponIds.length - erroresCupones.length,
    cupones_error:   erroresCupones.length,
  };

  console.log('WEBHOOK PROCESADO OK:', JSON.stringify(resultado));

  return new Response(JSON.stringify(resultado), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
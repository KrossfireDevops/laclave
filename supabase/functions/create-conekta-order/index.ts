import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function generarCodigoRedencion() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = 'CLAVE-';
  for (let i = 0; i < 5; i++) {
    codigo += chars[Math.floor(Math.random() * chars.length)];
  }
  return codigo;
}

serve(async (req) => {
  console.log('INICIO - metodo:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Metodo no permitido' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    console.log('BODY recibido:', JSON.stringify(body));

    const { usuario_id, carrito_ids, metodo_pago } = body;

    if (!usuario_id || !carrito_ids?.length || !metodo_pago) {
      return new Response(JSON.stringify({ error: 'Datos incompletos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl      = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey  = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Validar sesión del usuario
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Token requerido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: 'Bearer ' + token } }
    });

    const authResult = await supabaseUser.auth.getUser();
    const user = authResult.data.user;
    const authError = authResult.error;

    console.log('USER id:', user?.id ?? 'null');
    console.log('AUTH error:', authError?.message ?? 'ninguno');

    if (authError || !user || user.id !== usuario_id) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cliente con service role para operaciones de DB
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener items del carrito con datos de cupones
    const carritoResult = await supabase
      .from('carritos')
      .select('id, cupon_id, cupones(id, nombre_cupon, precio_cupon, descuento_porcentaje)')
      .in('id', carrito_ids)
      .eq('usuario_id', usuario_id)
      .eq('status', 'active');

    const carritoItems = carritoResult.data;
    const carritoError = carritoResult.error;

    console.log('CARRITO items:', carritoItems?.length ?? 0);
    console.log('CARRITO error:', carritoError?.message ?? 'ninguno');

    if (carritoError || !carritoItems || carritoItems.length === 0) {
      return new Response(JSON.stringify({ error: 'Carrito invalido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calcular monto total
    let montoTotal = 0;
    for (const item of carritoItems) {
      const precio    = item.cupones?.precio_cupon || 0;
      const descuento = item.cupones?.descuento_porcentaje || 0;
      montoTotal += precio * (1 - descuento / 100);
    }

    const timestamp  = Date.now();
    const random     = Math.random().toString(36).slice(2, 8).toUpperCase();
    const ordenId    = 'ord_' + timestamp;
    const referencia = 'LC-' + timestamp + '-' + random;
    const expiresAt  = new Date(timestamp + 15 * 60 * 1000).toISOString();
    const montoFinal = Math.round(montoTotal);

    // ✅ NUEVO: Guardar la orden en la tabla ordenes
    const { error: ordenError } = await supabase
      .from('ordenes')
      .insert({
        orden_id:    ordenId,
        usuario_id:  usuario_id,
        monto_total: montoFinal,
        metodo_pago: metodo_pago,
        status:      'pending',
        referencia:  referencia,
        expires_at:  expiresAt,
      });

    if (ordenError) {
      console.log('ERROR al guardar orden:', ordenError.message);
      return new Response(JSON.stringify({ error: 'No se pudo registrar la orden' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ✅ NUEVO: Registrar qué cupones pertenecen a esta orden
    const cuponIds = carritoItems
      .map(item => item.cupones?.id)
      .filter(Boolean);

    if (cuponIds.length > 0) {
      const relacionesCupones = cuponIds.map(cuponId => ({
        orden_id: ordenId,
        cupon_id: cuponId,
      }));

      const { error: relacionError } = await supabase
        .from('orden_cupones')
        .insert(relacionesCupones);

      if (relacionError) {
        console.log('ERROR al registrar cupones en orden:', relacionError.message);
      }

      // Marcar cupones como pending_payment
      await supabase
        .from('cupones')
        .update({ status: 'pending_payment' })
        .in('id', cuponIds);
    }

    console.log('ORDEN guardada OK:', ordenId, '- monto:', montoFinal);

    // Respuesta al frontend
    const responseData = {
      orden_id:    ordenId,
      monto_total: montoFinal,
      expires_at:  expiresAt,
      status:      'pending',
      referencia:  metodo_pago === 'oxxo' ? referencia : undefined,
      qr_url:      metodo_pago === 'codi'
        ? 'https://api.qrserver.com/v1/create-qr-code/?data=' + encodeURIComponent(referencia) + '&size=300x300'
        : undefined,
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.log('EXCEPCION:', error.message);
    return new Response(JSON.stringify({
      error:   'Error interno del servidor',
      details: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
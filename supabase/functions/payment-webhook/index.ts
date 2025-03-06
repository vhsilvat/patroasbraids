import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Configurações do Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Configurações do Mercado Pago
const mercadoPagoAccessToken = Deno.env.get('MP_ACCESS_TOKEN') ?? '';

serve(async (req) => {
  // Verificar método
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Criar cliente Supabase com a Service Role Key para acesso total
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Processar o corpo da requisição
    const payload = await req.json();
    
    // Verificar se é uma notificação do Mercado Pago
    if (!payload.data || !payload.type) {
      return new Response(JSON.stringify({ error: 'Payload inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar se é uma notificação de pagamento
    if (payload.type !== 'payment') {
      return new Response(JSON.stringify({ message: 'Notificação não processada (não é um pagamento)' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const paymentId = payload.data.id;
    
    // Obter detalhes do pagamento da API do Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
      }
    });
    
    if (!mpResponse.ok) {
      throw new Error(`Erro ao consultar pagamento: ${mpResponse.statusText}`);
    }
    
    const paymentData = await mpResponse.json();
    
    // Extrair informações relevantes
    const externalReference = paymentData.external_reference; // Deve conter o appointmentId
    const paymentStatus = paymentData.status; // 'approved', 'pending', 'rejected', etc.
    
    // Extrair ID do agendamento do external_reference (formato appointment_XXX_timestamp)
    const appointmentIdMatch = externalReference?.match(/appointment_(\d+)_/);
    
    if (!appointmentIdMatch) {
      throw new Error('Referência externa inválida ou mal formatada');
    }
    
    const appointmentId = parseInt(appointmentIdMatch[1], 10);
    
    // Mapear status do Mercado Pago para nosso sistema
    let mappedStatus: 'pending' | 'approved' | 'rejected';
    
    switch (paymentStatus) {
      case 'approved':
        mappedStatus = 'approved';
        break;
      case 'rejected':
      case 'cancelled':
      case 'refunded':
      case 'charged_back':
        mappedStatus = 'rejected';
        break;
      default:
        mappedStatus = 'pending';
    }
    
    // 1. Atualizar o registro de pagamento no Supabase
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .update({
        status: mappedStatus,
        external_reference: paymentId.toString()
      })
      .eq('appointment_id', appointmentId)
      .select()
      .single();
    
    if (paymentError) {
      throw new Error(`Erro ao atualizar pagamento: ${paymentError.message}`);
    }
    
    // 2. Atualizar o status do agendamento
    const appointmentStatus = mappedStatus === 'approved' ? 'confirmed' : 'pending';
    
    const { error: appointmentError } = await supabase
      .from('appointments')
      .update({ status: appointmentStatus })
      .eq('id', appointmentId);
    
    if (appointmentError) {
      throw new Error(`Erro ao atualizar agendamento: ${appointmentError.message}`);
    }
    
    // 3. Registrar a notificação para fins de logging
    await supabase
      .from('payment_notifications')
      .insert({
        payment_id: paymentRecord.id,
        external_payment_id: paymentId.toString(),
        status: mappedStatus,
        raw_data: JSON.stringify(paymentData)
      });
    
    // Responder com sucesso
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Notificação processada com sucesso',
      status: mappedStatus,
      appointmentId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    // Registrar o erro
    console.error('Erro ao processar webhook:', error);
    
    // Responder com erro
    return new Response(JSON.stringify({ 
      error: 'Erro ao processar webhook', 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
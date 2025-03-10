// Este arquivo fornece funções para integração com a API do Mercado Pago
// Na implementação real, você precisará incluir a SDK do Mercado Pago

// Para desenvolvimento, podemos usar funções simuladas
// Em produção, substitua por integrações reais com a SDK do Mercado Pago

import { Appointment, Payment } from '../types/supabase';
import { createPayment, updateAppointmentStatus } from './services';

// Interfaces
interface CreatePreferenceParams {
  appointmentId: number;
  serviceId: number;
  serviceName: string;
  servicePrice: number;
  clientName: string;
  clientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
}

interface PaymentResult {
  success: boolean;
  paymentId?: number;
  checkoutUrl?: string;
  error?: string;
}

// Função para criar uma preferência de pagamento (simulada)
export async function createPaymentPreference(params: CreatePreferenceParams): Promise<PaymentResult> {
  try {
    // Em produção, isso usaria a SDK do Mercado Pago para criar uma preferência
    // const mercadopago = require('mercadopago');
    // mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });
    
    // Simulação: criar um registro de pagamento no Supabase
    const amount = params.servicePrice * 0.5; // 50% do valor total como sinal
    
    const paymentData = {
      appointment_id: params.appointmentId,
      amount: amount,
      status: 'pending' as Payment['status'],
      payment_method: 'mercadopago',
      external_reference: `appointment_${params.appointmentId}_${Date.now()}`
    };
    
    const { data, error } = await createPayment(paymentData);
    
    if (error || !data) {
      console.error('Erro ao criar registro de pagamento:', error);
      return {
        success: false,
        error: error?.message || 'Erro ao criar pagamento'
      };
    }
    
    // Em produção, aqui retornaria a URL de checkout do Mercado Pago
    // Simulação: retornar uma URL fictícia para desenvolvimento
    const checkoutUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${data.external_reference}`;
    
    return {
      success: true,
      paymentId: data.id,
      checkoutUrl
    };
  } catch (error: any) {
    console.error('Erro ao criar preferência de pagamento:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao processar pagamento'
    };
  }
}

// Função para processar callback de pagamento (webhook)
export async function processPaymentCallback(
  paymentId: number, 
  status: 'approved' | 'pending' | 'rejected'
): Promise<boolean> {
  try {
    console.log(`Processando callback de pagamento: ID=${paymentId}, status=${status}`);
    
    // Em produção, atualizaria o status baseado no webhook do Mercado Pago
    // Simulação: atualizar o status do pagamento no Supabase
    
    // Garantir que temos o ID do agendamento
    const appointmentId = localStorage.getItem('lastAppointmentId');
    if (!appointmentId) {
      console.warn('ID do agendamento não encontrado no localStorage');
    } else {
      console.log('Processando pagamento para agendamento:', appointmentId);
    }
    
    // Atualizar status do pagamento
    const { data, error } = await updatePaymentStatus(paymentId, status as Payment['status']);
    
    if (error) {
      console.error('Erro ao atualizar status do pagamento:', error);
      
      // Se falhar, tentar atualizar o status do agendamento diretamente
      if (appointmentId) {
        const appointmentStatus = status === 'approved' ? 'confirmed' : 'pending';
        await updateAppointmentStatus(parseInt(appointmentId), appointmentStatus as Appointment['status']);
        console.log('Status do agendamento atualizado diretamente');
      }
      
      return true; // Retornar true mesmo com erro para não interromper o fluxo
    }
    
    if (data) {
      console.log('Status do pagamento atualizado com sucesso');
      
      // Atualizar status do agendamento
      const appointmentStatus = status === 'approved' ? 'confirmed' : 'pending';
      
      // Verificar se temos um appointment_id válido do pagamento
      const paymentAppointmentId = data.appointment_id || (appointmentId ? parseInt(appointmentId) : 0);
      
      if (paymentAppointmentId > 0) {
        await updateAppointmentStatus(paymentAppointmentId, appointmentStatus as Appointment['status']);
        console.log('Status do agendamento atualizado com sucesso');
      } else {
        console.warn('Não foi possível atualizar o status do agendamento: ID inválido');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao processar callback de pagamento:', error);
    return true; // Retornar true mesmo com erro para não interromper o fluxo
  }
}

// Função para simular uma aprovação de pagamento (para testes)
export async function simulatePaymentApproval(paymentId: number): Promise<boolean> {
  return processPaymentCallback(paymentId, 'approved');
}

// Função para recuperar informações de um pagamento (simulada)
export async function getPaymentInfo(paymentId: number): Promise<any> {
  // Em produção, consultaria a API do Mercado Pago
  // Simulação: retornar dados fictícios
  return {
    id: paymentId,
    status: 'approved',
    payment_method: {
      id: 'credit_card',
      type: 'credit_card'
    },
    transaction_amount: 150.00,
    currency_id: 'BRL',
    date_approved: new Date().toISOString()
  };
}

// Função auxiliar para atualizar status do pagamento
async function updatePaymentStatus(paymentId: number, status: Payment['status']) {
  // Usando a função do services.ts
  return await import('./services').then(services => services.updatePaymentStatus(paymentId, status));
}
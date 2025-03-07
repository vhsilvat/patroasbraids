import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Appointment, Service, Payment } from '../../types/supabase';
import { createPaymentPreference } from '../../lib/mercadopago';
import MockPixPayment from './MockPixPayment';
import { supabase } from '../../lib/supabase';
import { updateAppointmentStatus } from '../../lib/services';

interface PaymentProcessorProps {
  appointment: Appointment;
  service: Service;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Componente responsável por gerenciar o fluxo de pagamento
 * 
 * Este componente é modularizado para permitir:
 * 1. Fácil substituição do gateway de pagamento no futuro
 * 2. Alteração simples do fluxo de pagamento sem impactar outros componentes
 * 3. Melhor separação de responsabilidades
 */
const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  appointment,
  service,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<{
    paymentId: number;
    amount: number;
  } | null>(null);
  const navigate = useNavigate();

  // Inicializar o processo de pagamento
  useEffect(() => {
    const initializePayment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Verificar se o pagamento já existe para este agendamento
        const { data: existingPayments, error: fetchError } = await supabase
          .from('payments')
          .select('*')
          .eq('appointment_id', appointment.id);
          
        if (fetchError) {
          throw new Error(`Erro ao verificar pagamentos: ${fetchError.message}`);
        }
        
        // 2. Se já existe um pagamento pendente, use-o em vez de criar um novo
        if (existingPayments && existingPayments.length > 0) {
          const pendingPayment = existingPayments.find(p => p.status === 'pending');
          
          if (pendingPayment) {
            setPaymentData({
              paymentId: pendingPayment.id,
              amount: pendingPayment.amount
            });
            setLoading(false);
            return;
          }
        }
        
        // 3. Caso contrário, crie uma nova preferência de pagamento
        const { success, paymentId, error: prefError } = await createPaymentPreference({
          appointmentId: appointment.id,
          serviceId: service.id,
          serviceName: service.name,
          servicePrice: service.price,
          clientName: 'Cliente', // Idealmente, obter nome do context de auth
          clientEmail: 'cliente@example.com', // Idealmente, obter email do context de auth
          appointmentDate: appointment.appointment_date,
          appointmentTime: appointment.appointment_time
        });
        
        if (!success || !paymentId) {
          throw new Error(prefError || 'Erro ao criar pagamento');
        }
        
        // 4. Armazenar dados para a interface de pagamento
        setPaymentData({
          paymentId,
          amount: service.price * 0.5 // 50% do valor como sinal
        });
      } catch (err: any) {
        console.error('Erro ao inicializar pagamento:', err);
        setError(err.message || 'Erro ao iniciar o processo de pagamento');
        
        if (onError) {
          onError(err.message || 'Erro ao iniciar o processo de pagamento');
        }
      } finally {
        setLoading(false);
      }
    };
    
    initializePayment();
  }, [appointment, service, onError]);

  // Gerenciar cancelamento do pagamento
  const handleCancel = async () => {
    // Redirecionar para a página de conta (o status permanece como pendente)
    navigate('/conta');
  };

  // Gerenciar sucesso no pagamento
  const handleSuccess = async () => {
    if (onSuccess) {
      onSuccess();
    } else {
      // Redirecionar para a página de conta com agendamento confirmado
      navigate('/conta');
    }
  };

  // Tratar conflitos de horário e cancelar agendamentos anteriores
  useEffect(() => {
    // Esta função é executada quando um pagamento é confirmado
    // para cancelar outros agendamentos pendentes no mesmo horário
    const cancelConflictingAppointments = async () => {
      if (appointment.status === 'confirmed') {
        try {
          // 1. Buscar agendamentos pendentes no mesmo horário e data, com o mesmo profissional
          const { data: conflictingAppointments, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('professional_id', appointment.professional_id)
            .eq('appointment_date', appointment.appointment_date)
            .eq('status', 'pending')
            .neq('id', appointment.id);
          
          if (error) {
            console.error('Erro ao buscar agendamentos conflitantes:', error);
            return;
          }
          
          // 2. Filtrar os que se sobrepõem no horário
          const appointmentStartTime = new Date(`2000-01-01T${appointment.appointment_time}`);
          const appointmentEndTime = new Date(appointmentStartTime.getTime() + service.duration * 60000);
          
          const overlappingAppointments = conflictingAppointments.filter(app => {
            // Para cada agendamento pendente, verificar se há sobreposição de horário
            const appStartTime = new Date(`2000-01-01T${app.appointment_time}`);
            
            // Buscar o serviço para obter a duração
            return (
              (appStartTime >= appointmentStartTime && appStartTime < appointmentEndTime) ||
              (appStartTime <= appointmentStartTime && appStartTime.getTime() + service.duration * 60000 > appointmentStartTime.getTime())
            );
          });
          
          // 3. Cancelar os agendamentos que se sobrepõem
          for (const app of overlappingAppointments) {
            await updateAppointmentStatus(app.id, 'cancelled');
            console.log(`Agendamento ${app.id} cancelado devido a conflito de horário`);
          }
        } catch (err) {
          console.error('Erro ao cancelar agendamentos conflitantes:', err);
        }
      }
    };
    
    cancelConflictingAppointments();
  }, [appointment, service]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erro ao Processar Pagamento</h2>
          <p className="text-gray-600">{error}</p>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/conta')}
            className="btn btn-primary"
          >
            Voltar para Minha Conta
          </button>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-yellow-600 mb-2">Dados de Pagamento não Encontrados</h2>
          <p className="text-gray-600">Não foi possível obter os dados necessários para processar o pagamento.</p>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/conta')}
            className="btn btn-primary"
          >
            Voltar para Minha Conta
          </button>
        </div>
      </div>
    );
  }

  // Renderizar o componente de pagamento PIX
  return (
    <MockPixPayment
      paymentId={paymentData.paymentId}
      appointmentId={appointment.id}
      service={service}
      date={appointment.appointment_date}
      time={appointment.appointment_time}
      amount={paymentData.amount}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

export default PaymentProcessor;
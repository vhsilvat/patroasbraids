import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createAppointment, getServiceById } from '../../lib/services';
import { Service, Professional } from '../../types/supabase';
import MockPixPayment from './MockPixPayment';

interface PaymentProcessorProps {
  serviceId: number;
  professionalId: string;
  date: string;
  time: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  serviceId,
  professionalId,
  date,
  time,
  onSuccess,
  onCancel
}) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [appointmentId, setAppointmentId] = useState<number | null>(null);

  // Etapas do processamento de pagamento
  const [step, setStep] = useState<'creating' | 'payment' | 'completed' | 'failed'>('creating');

  useEffect(() => {
    async function processAppointment() {
      if (!user || !profile) {
        setError('Usuário não autenticado');
        setStep('failed');
        return;
      }

      try {
        setLoading(true);
        
        // 1. Tentar obter informações do serviço
        // Em um cenário real buscaria do Supabase, mas vamos simular para desenvolvimento
        setService({
          id: serviceId,
          name: 'Box Braids',
          description: 'Tranças box braids tradicionais',
          duration: 300,
          price: 250.00,
          image_url: 'https://example.com/boxbraids.jpg'
        });
        
        setProfessional({
          id: professionalId,
          name: 'Ana Silva',
          specialties: ['Box Braids', 'Knotless Braids'],
          availability: []
        });
        
        // 2. Criar agendamento no Supabase
        const appointmentData = {
          user_id: user.id,
          professional_id: professionalId,
          service_id: serviceId,
          appointment_date: date,
          appointment_time: time,
          status: 'pending' as const
        };
        
        // Em um cenário real, faremos a chamada para o Supabase
        // Para desenvolvimento, vamos simular:
        /*
        const { data: appointmentResult, error: appointmentError } = await createAppointment(appointmentData);
        
        if (appointmentError || !appointmentResult) {
          throw new Error(appointmentError?.message || 'Erro ao criar agendamento');
        }
        
        setAppointmentId(appointmentResult.id);
        */
        
        // Simulação do ID do agendamento
        setAppointmentId(Math.floor(Math.random() * 10000));
        
        // Mudar para a etapa de pagamento
        setStep('payment');
        
      } catch (err: any) {
        console.error('Erro no processamento do agendamento:', err);
        setError(err.message || 'Ocorreu um erro ao processar seu agendamento');
        setStep('failed');
      } finally {
        setLoading(false);
      }
    }
    
    processAppointment();
  }, [user, profile, serviceId, professionalId, date, time]);

  // Função para lidar com o sucesso do pagamento
  const handlePaymentSuccess = () => {
    // Aqui seria atualizado o status do pagamento no Supabase
    // Para simulação, vamos apenas exibir a mensagem de sucesso e redirecionar
    setStep('completed');
    
    // Aguardar um momento para mostrar a confirmação antes de redirecionar
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  const renderStepContent = () => {
    switch (step) {
      case 'creating':
        return (
          <div className="text-center py-8">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"
              role="status"
              aria-label="Carregando"
            ></div>
            <p>Preparando seu agendamento...</p>
          </div>
        );
        
      case 'payment':
        if (!service) return null;
        
        return (
          <MockPixPayment 
            amount={service.price * 0.5} // 50% do valor
            serviceName={service.name}
            onSuccess={handlePaymentSuccess}
            onCancel={onCancel}
          />
        );
        
      case 'completed':
        return (
          <div className="text-center py-8">
            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-600 mb-2">Pagamento aprovado!</h3>
            <p className="mb-4">Seu agendamento foi confirmado com sucesso.</p>
            <p className="text-sm text-gray-500">Redirecionando para o painel...</p>
          </div>
        );
        
      case 'failed':
        return (
          <div className="text-center py-8">
            <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-red-600 mb-2">Ops! Algo deu errado</h3>
            {error && <p className="mb-4 text-red-600">{error}</p>}
            <button
              onClick={onCancel}
              className="btn btn-outline"
            >
              Voltar e tentar novamente
            </button>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-primary mb-4">Processamento de Agendamento</h2>
      {renderStepContent()}
    </div>
  );
};

export default PaymentProcessor;
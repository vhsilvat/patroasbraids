import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createAppointment } from '../../lib/services';
import { createPaymentPreference, simulatePaymentApproval } from '../../lib/mercadopago';
import { Service, Professional } from '../../types/supabase';

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
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Etapas do processamento de pagamento
  const [step, setStep] = useState<'creating' | 'checkout' | 'completed' | 'failed'>('creating');

  useEffect(() => {
    async function processAppointment() {
      if (!user || !profile) {
        setError('Usuário não autenticado');
        setStep('failed');
        return;
      }

      try {
        setLoading(true);
        
        // 1. Criar agendamento no Supabase
        const appointmentData = {
          user_id: user.id,
          professional_id: professionalId,
          service_id: serviceId,
          appointment_date: date,
          appointment_time: time,
          status: 'pending' as const
        };
        
        const { data: appointmentResult, error: appointmentError } = await createAppointment(appointmentData);
        
        if (appointmentError || !appointmentResult) {
          throw new Error(appointmentError?.message || 'Erro ao criar agendamento');
        }
        
        setAppointmentId(appointmentResult.id);
        
        // 2. Em um cenário real, buscaríamos os detalhes do serviço e profissional
        // Simulação para desenvolvimento:
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
        
        // 3. Criar preferência de pagamento no Mercado Pago
        const paymentParams = {
          appointmentId: appointmentResult.id,
          serviceId: serviceId,
          serviceName: 'Box Braids', // Em produção, usar service.name
          servicePrice: 250.00, // Em produção, usar service.price
          clientName: profile.name,
          clientEmail: profile.email,
          appointmentDate: date,
          appointmentTime: time
        };
        
        const paymentResult = await createPaymentPreference(paymentParams);
        
        if (!paymentResult.success || !paymentResult.checkoutUrl) {
          throw new Error(paymentResult.error || 'Erro ao criar pagamento');
        }
        
        setPaymentId(paymentResult.paymentId || null);
        setCheckoutUrl(paymentResult.checkoutUrl);
        setStep('checkout');
        
      } catch (err: any) {
        console.error('Erro no processamento do pagamento:', err);
        setError(err.message || 'Ocorreu um erro ao processar seu agendamento');
        setStep('failed');
      } finally {
        setLoading(false);
      }
    }
    
    processAppointment();
  }, [user, profile, serviceId, professionalId, date, time]);

  // Função para simular aprovação de pagamento (apenas para desenvolvimento)
  const handleSimulatePayment = async () => {
    if (!paymentId) return;
    
    setLoading(true);
    
    try {
      const success = await simulatePaymentApproval(paymentId);
      
      if (success) {
        setPaymentStatus('approved');
        setStep('completed');
        // Aguardar um momento para mostrar a confirmação antes de redirecionar
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        throw new Error('Falha ao processar pagamento');
      }
    } catch (err: any) {
      console.error('Erro ao simular pagamento:', err);
      setError(err.message || 'Erro ao processar pagamento');
      setStep('failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'creating':
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Preparando seu agendamento...</p>
          </div>
        );
        
      case 'checkout':
        return (
          <div className="py-4">
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Resumo do agendamento</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p><span className="font-medium">Serviço:</span> {service?.name}</p>
                <p><span className="font-medium">Profissional:</span> {professional?.name}</p>
                <p><span className="font-medium">Data:</span> {new Date(date).toLocaleDateString('pt-BR')}</p>
                <p><span className="font-medium">Horário:</span> {time}</p>
                <p><span className="font-medium">Valor total:</span> {service?.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p className="font-medium mt-2">Sinal a pagar: {service ? (service.price * 0.5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</p>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Importante:</strong> Em ambiente de produção, você seria redirecionado para a página de pagamento do Mercado Pago.
                Para fins de demonstração, você pode simular a aprovação do pagamento clicando no botão abaixo.
              </p>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleSimulatePayment}
                disabled={loading}
                className="btn btn-primary flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-5 w-5 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                    Processando...
                  </>
                ) : 'Simular aprovação do pagamento'}
              </button>
              
              <button
                onClick={onCancel}
                disabled={loading}
                className="btn btn-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
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
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-primary mb-4">Processamento de Pagamento</h2>
      {renderStepContent()}
    </div>
  );
};

export default PaymentProcessor;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Service, Appointment } from '../types/supabase';
import PaymentProcessor from '../components/Payment/PaymentProcessor';

/**
 * Página de pagamento que carrega os dados do agendamento
 * e renderiza o processador de pagamento
 */
const PaymentPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [service, setService] = useState<Service | null>(null);

  // Carregar dados do agendamento e serviço relacionado
  useEffect(() => {
    const fetchAppointmentData = async () => {
      if (!appointmentId || !user) {
        setError('Dados de agendamento inválidos ou usuário não autenticado');
        setLoading(false);
        return;
      }

      try {
        // Buscar agendamento com detalhes do serviço
        const { data, error: appointmentError } = await supabase
          .from('appointments')
          .select(`
            *,
            service:service_id(*)
          `)
          .eq('id', appointmentId)
          .single();

        if (appointmentError || !data) {
          throw new Error(appointmentError?.message || 'Agendamento não encontrado');
        }

        // Verificar se o agendamento pertence ao usuário atual
        if (data.user_id !== user.id) {
          throw new Error('Você não tem permissão para acessar este agendamento');
        }

        // Extrair dados do serviço e agendamento
        setAppointment({
          id: data.id,
          user_id: data.user_id,
          professional_id: data.professional_id,
          service_id: data.service_id,
          appointment_date: data.appointment_date,
          appointment_time: data.appointment_time,
          status: data.status,
          notes: data.notes,
          created_at: data.created_at
        });

        setService(data.service);
      } catch (err: any) {
        console.error('Erro ao buscar dados do agendamento:', err);
        setError(err.message || 'Erro ao carregar dados do agendamento');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentData();
  }, [appointmentId, user]);

  // Tratar sucesso no pagamento
  const handlePaymentSuccess = () => {
    navigate('/conta');
  };

  // Tratar erro no pagamento
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
          <div className="text-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Erro</h2>
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
      </div>
    );
  }

  if (!appointment || !service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
          <div className="text-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">Dados não encontrados</h2>
            <p className="text-gray-600">Não foi possível encontrar os dados do agendamento.</p>
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary">Finalizar Pagamento</h1>
          <p className="text-gray-600">Conclua o pagamento para confirmar seu agendamento</p>
        </div>
        
        <PaymentProcessor
          appointment={appointment}
          service={service}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>
    </div>
  );
};

export default PaymentPage;
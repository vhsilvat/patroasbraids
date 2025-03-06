import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Appointment, Service, Professional, Payment } from '../../types/supabase';

interface ExtendedAppointment extends Appointment {
  service: Service;
  professional: Pick<Professional, 'id' | 'name'>;
  payment?: Payment;
}

const AppointmentsList: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<ExtendedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar todos os agendamentos do usuário com os dados relacionados
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          service:service_id(*),
          professional:professional_id(id, name),
          payment:payment_id(*)
        `)
        .eq('user_id', user?.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) {
        throw error;
      }

      setAppointments(data as ExtendedAppointment[]);
    } catch (err: any) {
      console.error('Erro ao buscar agendamentos:', err);
      setError('Não foi possível carregar seus agendamentos. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar agendamentos baseado na tab ativa
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const today = new Date();
    
    if (activeTab === 'upcoming') {
      return appointmentDate >= today || appointment.status === 'pending';
    } else {
      return appointmentDate < today && appointment.status !== 'pending';
    }
  });

  // Formatar data para exibição
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Obter o status label colorido
  const getStatusBadge = (status: string, payment?: Payment) => {
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';
    let label = 'Desconhecido';

    // Se o pagamento estiver pendente, o status também é pendente
    if (payment && payment.status === 'pending') {
      status = 'pending';
    }

    switch (status) {
      case 'pending':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        label = 'Aguardando pagamento';
        break;
      case 'confirmed':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        label = 'Confirmado';
        break;
      case 'completed':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        label = 'Concluído';
        break;
      case 'cancelled':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        label = 'Cancelado';
        break;
    }

    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {label}
      </span>
    );
  };

  // Formatação do horário
  const formatTime = (timeString: string): string => {
    return timeString.substring(0, 5); // Exibir apenas HH:MM
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary">Meus Agendamentos</h2>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
          <button 
            className="mt-2 text-sm underline"
            onClick={fetchAppointments}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Tabs para alternar entre agendamentos futuros e passados */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex">
          <button
            className={`py-4 px-1 mr-8 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            Próximos
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('past')}
          >
            Histórico
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum agendamento encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === 'upcoming'
              ? 'Você não possui agendamentos futuros'
              : 'Você não possui agendamentos passados'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div className="bg-gray-50 p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-primary">
                    {formatDate(appointment.appointment_date)}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {formatTime(appointment.appointment_time)}
                  </p>
                </div>
                <div>
                  {getStatusBadge(appointment.status, appointment.payment)}
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                  <div className="mb-2 md:mb-0">
                    <h3 className="font-bold text-lg">
                      {appointment.service.name}
                    </h3>
                    <p className="text-gray-600">
                      com {appointment.professional.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-primary">
                      {appointment.service.price.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </p>
                    <p className="text-gray-500 text-sm">
                      Duração: {Math.floor(appointment.service.duration / 60)}h
                      {appointment.service.duration % 60 > 0
                        ? ` ${appointment.service.duration % 60}min`
                        : ''}
                    </p>
                  </div>
                </div>
                
                {/* Se o status for pendente, mostrar botões de ação */}
                {(appointment.status === 'pending' || (appointment.payment && appointment.payment.status === 'pending')) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        // Integração com pagamento - Mock para demonstração
                        alert('Redirecionando para o Mercado Pago...');
                      }}
                    >
                      Efetuar Pagamento
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsList;
import React, { useState, useEffect } from 'react';
import { Service, Professional, ProfessionalAvailability, Appointment } from '../../types/supabase';
import Calendar from '../Calendar/Calendar';
import TimeSlotPicker from '../TimeSlotPicker/TimeSlotPicker';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getProfessionals, getProfessionalAvailability, getAppointmentsForDateRange, createAppointment } from '../../lib/services';
import { createPaymentPreference } from '../../lib/mercadopago';
import { supabase } from '../../lib/supabase';

interface AppointmentFormProps {
  selectedService?: Service;
  onSubmit: (appointment: AppointmentData) => void;
}

interface AppointmentData {
  serviceId: number;
  professionalId: string;
  date: string;
  time: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ selectedService, onSubmit }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookedDates, setBookedDates] = useState<Date[]>([]); // datas já reservadas
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para controlar o fluxo do formulário
  const [step, setStep] = useState<'select-professional' | 'select-date' | 'select-time'>('select-professional');

  // Carregar profissionais
  useEffect(() => {
    async function loadProfessionals() {
      setLoading(true);
      setError(null);
      
      try {
        // Consultar diretamente sem complexidade
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email, role, photo_url')
          .eq('role', 'professional');
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (data && Array.isArray(data)) {
          // Converter para o formato esperado
          const enhancedData = data.map(prof => ({
            ...prof,
            user_id: prof.id,
            specialties: [],
            photo_url: prof.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.name)}&background=8B5CF6&color=fff&size=200`
          }));
          
          setProfessionals(enhancedData);
        } else {
          // Em caso de dados vazios, evitar exibir erro
          setProfessionals([]);
        }
      } catch (err: any) {
        console.error("Erro ao carregar profissionais:", err);
        setError("Não foi possível carregar os profissionais. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    }
    
    loadProfessionals();
  }, []);

  // Atualizar serviço quando selectedService mudar
  useEffect(() => {
    if (selectedService) {
      // Resetar o formulário se o serviço mudar
      setSelectedProfessional(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setStep('select-professional');
    }
  }, [selectedService]);

  // Carregar disponibilidade e compromissos para o profissional selecionado
  useEffect(() => {
    if (!selectedProfessional) return;
    
    async function loadProfessionalAvailability() {
      setLoading(true);
      setError(null);
      
      try {
        // Buscar configuração de disponibilidade por dia da semana
        const { data: availabilityData, error: availabilityError } = 
          await getProfessionalAvailability(selectedProfessional.id);
        
        if (availabilityError) {
          throw new Error(availabilityError.message);
        }
        
        // Buscar compromissos existentes para o próximo mês
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        
        const { data: appointmentsData, error: appointmentsError } = 
          await getAppointmentsForDateRange(
            selectedProfessional.id,
            today.toISOString().split('T')[0],
            nextMonth.toISOString().split('T')[0]
          );
        
        if (appointmentsError) {
          throw new Error(appointmentsError.message);
        }
        
        // Processar os dias indisponíveis (compromissos existentes)
        const unavailableDates: Date[] = [];
        
        if (appointmentsData) {
          appointmentsData.forEach((appointment: Appointment) => {
            const date = new Date(appointment.appointment_date);
            unavailableDates.push(date);
          });
        }
        
        setBookedDates(unavailableDates);
        
      } catch (err: any) {
        console.error("Erro ao carregar disponibilidade:", err);
        setError("Não foi possível carregar a disponibilidade. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    }
    
    loadProfessionalAvailability();
  }, [selectedProfessional]);

  // Gerar horários disponíveis com base na data e serviço selecionados
  useEffect(() => {
    if (!selectedService || !selectedDate || !selectedProfessional) return;
    
    async function getAvailableTimeSlots() {
      setLoading(true);
      setError(null);
      
      try {
        // Buscar compromissos para o dia selecionado
        const formattedDate = selectedDate.toISOString().split('T')[0];
        
        const { data: appointmentsData, error: appointmentsError } = 
          await getAppointmentsForDateRange(
            selectedProfessional.id,
            formattedDate,
            formattedDate
          );
        
        if (appointmentsError) {
          throw new Error(appointmentsError.message);
        }
        
        // Buscar configuração de disponibilidade para o dia da semana
        const { data: availabilityData, error: availabilityError } = 
          await getProfessionalAvailability(selectedProfessional.id);
        
        if (availabilityError) {
          throw new Error(availabilityError.message);
        }
        
        // Encontrar a configuração para o dia da semana atual
        const dayOfWeek = selectedDate.getDay();
        const dayAvailability = availabilityData?.find(
          (a: ProfessionalAvailability) => a.day_of_week === dayOfWeek && a.is_available
        );
        
        if (!dayAvailability) {
          // Profissional não trabalha neste dia
          setTimeSlots([]);
          return;
        }
        
        // Horários de trabalho do profissional
        const startTime = dayAvailability.start_time;
        const endTime = dayAvailability.end_time;
        
        // Converter para horas
        const startHour = parseInt(startTime.split(':')[0], 10);
        const endHour = parseInt(endTime.split(':')[0], 10);
        
        const serviceDurationHours = selectedService.duration / 60;
        
        // Se o serviço for mais longo que 6 horas, mostrar apenas horários da manhã
        const maxEndTime = serviceDurationHours > 6 ? 12 : endHour;
        
        // Gerar slots de 30 minutos
        const times: TimeSlot[] = [];
        for (let hour = startHour; hour <= maxEndTime - serviceDurationHours; hour++) {
          // Hora cheia
          times.push({
            time: `${hour}:00`,
            available: true 
          });
          
          // Meia hora, se couber no intervalo
          if (hour < maxEndTime - serviceDurationHours) {
            times.push({
              time: `${hour}:30`,
              available: true
            });
          }
        }
        
        // Marcar slots já agendados como indisponíveis
        if (appointmentsData && appointmentsData.length > 0) {
          appointmentsData.forEach((appointment: Appointment) => {
            const appointmentTime = appointment.appointment_time;
            const hour = parseInt(appointmentTime.split(':')[0], 10);
            const minute = parseInt(appointmentTime.split(':')[1], 10);
            
            // Encontrar o slot correspondente e marcá-lo como indisponível
            const timeString = `${hour}:${minute === 0 ? '00' : minute}`;
            
            // Marca o horário do agendamento como indisponível
            const slot = times.find(t => t.time === timeString);
            if (slot) {
              slot.available = false;
            }
            
            // Marca também horários que se sobreporiam com o agendamento existente
            // com base na duração do serviço atual
            const appointmentEndTime = new Date();
            appointmentEndTime.setHours(hour);
            appointmentEndTime.setMinutes(minute);
            appointmentEndTime.setMinutes(appointmentEndTime.getMinutes() + selectedService.duration);
            
            const endHour = appointmentEndTime.getHours();
            const endMinute = appointmentEndTime.getMinutes();
            
            // Marcar todos os slots que se sobrepõem ao agendamento existente
            times.forEach(slot => {
              const slotHour = parseInt(slot.time.split(':')[0], 10);
              const slotMinute = parseInt(slot.time.split(':')[1], 10);
              
              const slotEndTime = new Date();
              slotEndTime.setHours(slotHour);
              slotEndTime.setMinutes(slotMinute);
              slotEndTime.setMinutes(slotEndTime.getMinutes() + selectedService.duration);
              
              // Se o horário do slot se sobrepõe ao agendamento, marcá-lo como indisponível
              if ((slotHour > hour || (slotHour === hour && slotMinute >= minute)) && 
                  (slotHour < endHour || (slotHour === endHour && slotMinute < endMinute))) {
                slot.available = false;
              }
            });
          });
        }
        
        setTimeSlots(times);
        setSelectedTime(null); // Reset do horário quando a data muda
        
      } catch (err: any) {
        console.error("Erro ao carregar horários disponíveis:", err);
        setError("Não foi possível carregar os horários disponíveis. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    }
    
    getAvailableTimeSlots();
  }, [selectedDate, selectedService, selectedProfessional]);

  // Manipuladores de eventos
  const handleProfessionalSelect = (professional: Professional) => {
    setSelectedProfessional(professional);
    setStep('select-date');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep('select-time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Formatar a data como YYYY-MM-DD
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      // Criar agendamento diretamente no banco de dados
      const appointmentData = {
        user_id: user.id,
        professional_id: selectedProfessional.id,
        service_id: selectedService.id,
        appointment_date: formattedDate,
        appointment_time: selectedTime,
        status: 'pending'
      };
      
      // Criar o agendamento no Supabase
      const { data: newAppointment, error: appointmentError } = await createAppointment(appointmentData);
      
      if (appointmentError || !newAppointment) {
        throw new Error(appointmentError?.message || 'Erro ao criar agendamento');
      }
      
      console.log('Agendamento criado com sucesso:', newAppointment.id);
      
      // Também chamar o callback para manter compatibilidade
      onSubmit({
        serviceId: selectedService.id,
        professionalId: selectedProfessional.id,
        date: formattedDate,
        time: selectedTime
      });
      
      // Redirecionar para a página de pagamento
      navigate(`/pagamento/${newAppointment.id}`);
      
    } catch (err: any) {
      console.error("Erro ao processar agendamento:", err);
      setError("Não foi possível realizar o agendamento. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const getDisabledDays = async (): Promise<number[]> => {
    if (!selectedProfessional) return [0, 6]; // Fins de semana desativados por padrão
    
    try {
      // Buscar disponibilidade do profissional
      const { data, error } = await getProfessionalAvailability(selectedProfessional.id);
      
      if (error || !data) {
        return [0, 6]; // Padrão se houver erro
      }
      
      // Mapear dias da semana que o profissional NÃO trabalha
      const workingDays = data.filter(a => a.is_available).map(a => a.day_of_week);
      
      // Retornar dias que NÃO estão na lista de dias de trabalho
      return [0, 1, 2, 3, 4, 5, 6].filter(day => !workingDays.includes(day));
      
    } catch (err) {
      console.error("Erro ao buscar dias disponíveis:", err);
      return [0, 6]; // Padrão em caso de erro
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white p-6 rounded-lg shadow-md"
      data-testid="appointment-form"
    >
      <h2 className="text-2xl font-bold text-primary mb-4">Agendar Serviço</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {!selectedService && (
        <div className="mb-4">
          <p className="text-red-500">Por favor, selecione um serviço primeiro.</p>
        </div>
      )}
      
      {loading ? (
        <div className="py-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : selectedService && (
        <>
          <div className="mb-6">
            <p className="font-medium">Serviço selecionado:</p>
            <p className="text-primary">{selectedService.name} - {selectedService.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          
          {/* Etapa 1: Selecionar Profissional */}
          <div className={`${step !== 'select-professional' ? 'hidden' : ''}`}>
            <h3 className="text-lg font-semibold text-primary mb-3">Escolha uma profissional</h3>
            
            {professionals.length === 0 ? (
              <p className="text-gray-500">Nenhuma profissional disponível no momento.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {professionals.map(professional => (
                  <div 
                    key={professional.id}
                    onClick={() => handleProfessionalSelect(professional)}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-colors
                      ${selectedProfessional?.id === professional.id 
                        ? 'border-primary bg-primary bg-opacity-5' 
                        : 'border-gray-200 hover:border-primary'
                      }
                    `}
                    data-testid={`professional-card-${professional.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                        {professional.photo_url ? (
                          <img 
                            src={professional.photo_url} 
                            alt={professional.name}
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{professional.name}</h4>
                        <p className="text-sm text-gray-500">
                          {professional.specialties?.join(', ') || 'Todos os serviços'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Etapa 2: Selecionar Data */}
          <div className={`${step !== 'select-date' ? 'hidden' : ''}`}>
            <div className="mb-4 flex justify-between items-center">
              <button 
                type="button"
                onClick={() => setStep('select-professional')}
                className="flex items-center text-primary hover:underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </button>
              <div>
                <span className="font-medium">Profissional: </span>
                <span>{selectedProfessional?.name}</span>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-primary mb-3">Escolha uma data</h3>
            <Calendar 
              onSelectDate={handleDateSelect}
              disabledDays={[0, 6]} // Padrão simples para evitar problema com promise
              selectedDate={selectedDate || undefined}
              bookedDates={bookedDates}
            />
            
            <div className="mt-4 text-sm text-gray-500">
              <p>* Horários disponíveis serão mostrados após selecionar uma data.</p>
              <p>* Serviços com duração superior a 6 horas só podem ser agendados pela manhã.</p>
            </div>
          </div>
          
          {/* Etapa 3: Selecionar Horário */}
          <div className={`${step !== 'select-time' ? 'hidden' : ''}`}>
            <div className="mb-4 flex justify-between items-center">
              <button 
                type="button"
                onClick={() => setStep('select-date')}
                className="flex items-center text-primary hover:underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </button>
              <div>
                <span className="font-medium">Data: </span>
                <span>
                  {selectedDate?.toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long'
                  })}
                </span>
              </div>
            </div>
            
            {timeSlots.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-gray-500">Não há horários disponíveis para esta data.</p>
                <button
                  type="button"
                  onClick={() => setStep('select-date')}
                  className="mt-3 text-primary hover:underline"
                >
                  Escolher outra data
                </button>
              </div>
            ) : (
              <>
                <TimeSlotPicker 
                  timeSlots={timeSlots}
                  selectedTime={selectedTime}
                  onSelectTime={handleTimeSelect}
                />
                
                <div className="mt-6">
                  <div className="mb-4 p-3 bg-yellow-50 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Importante:</strong> Ao prosseguir, será solicitado o pagamento de 50% do valor do serviço como sinal.
                      O valor total do serviço é {selectedService.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    className="btn btn-primary w-full flex items-center justify-center"
                    disabled={!selectedTime || loading}
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin h-5 w-5 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                        Processando...
                      </>
                    ) : 'Prosseguir para Pagamento'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </form>
  );
};

export default AppointmentForm;
import React, { useState, useEffect } from 'react';
import { Service, Professional } from '../../types/supabase';
import Calendar from '../Calendar/Calendar';
import TimeSlotPicker from '../TimeSlotPicker/TimeSlotPicker';

interface AppointmentFormProps {
  selectedService?: Service;
  onSubmit: (appointment: AppointmentData) => void;
}

interface AppointmentData {
  serviceId: number;
  professionalId: number;
  date: string;
  time: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ selectedService, onSubmit }) => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookedDates, setBookedDates] = useState<Date[]>([]); // datas já reservadas
  
  // Estado para controlar o fluxo do formulário
  const [step, setStep] = useState<'select-professional' | 'select-date' | 'select-time'>('select-professional');

  // Carregar profissionais
  useEffect(() => {
    // Em uma implementação real, buscaríamos do Supabase
    const mockProfessionals: Professional[] = [
      {
        id: 1,
        name: 'Ana Silva',
        specialties: ['Box Braids', 'Knotless Braids'],
        availability: ['monday', 'tuesday', 'wednesday'],
        photo_url: 'https://example.com/ana.jpg'
      },
      {
        id: 2,
        name: 'Carla Oliveira',
        specialties: ['Twist', 'Crochet Braids'],
        availability: ['thursday', 'friday', 'saturday'],
        photo_url: 'https://example.com/carla.jpg'
      }
    ];
    
    setProfessionals(mockProfessionals);
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

  // Carregar datas reservadas para a profissional selecionada
  useEffect(() => {
    if (selectedProfessional) {
      // Em uma implementação real, buscaríamos do Supabase
      // Aqui, estamos gerando alguns dados fictícios para demonstração
      const mockBookedDates: Date[] = [];
      const today = new Date();
      
      // Adicionar algumas datas aleatórias como reservadas nos próximos 30 dias
      for (let i = 1; i <= 5; i++) {
        const randomDay = Math.floor(Math.random() * 30) + 1;
        const date = new Date(today);
        date.setDate(today.getDate() + randomDay);
        mockBookedDates.push(date);
      }
      
      setBookedDates(mockBookedDates);
    }
  }, [selectedProfessional]);

  // Gerar horários disponíveis com base na data e serviço selecionados
  useEffect(() => {
    if (!selectedService || !selectedDate) return;
    
    const times: TimeSlot[] = [];
    const startHour = 9; // 9h
    const endHour = 18; // 18h
    const serviceDurationHours = selectedService.duration / 60;
    
    // Se o serviço for mais longo que 6 horas, mostrar apenas horários da manhã
    const maxEndTime = serviceDurationHours > 6 ? 12 : endHour;
    
    for (let hour = startHour; hour <= maxEndTime - serviceDurationHours; hour++) {
      // Hora cheia
      times.push({
        time: `${hour}:00`,
        available: Math.random() > 0.3 // Aleatoriamente disponível para demonstração
      });
      
      // Meia hora, se couber no intervalo
      if (hour < maxEndTime - serviceDurationHours) {
        times.push({
          time: `${hour}:30`,
          available: Math.random() > 0.3
        });
      }
    }
    
    setTimeSlots(times);
    setSelectedTime(null); // Reset do horário quando a data muda
  }, [selectedDate, selectedService]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) return;
    
    // Formatar a data como YYYY-MM-DD
    const formattedDate = selectedDate.toISOString().split('T')[0];
    
    onSubmit({
      serviceId: selectedService.id,
      professionalId: selectedProfessional.id,
      date: formattedDate,
      time: selectedTime
    });
  };

  const getDisabledDays = (): number[] => {
    if (!selectedProfessional) return [0]; // Domingo desativado por padrão
    
    // Mapear dias de disponibilidade da profissional para números
    // 0 = domingo, 1 = segunda, etc.
    const availabilityMap: Record<string, number> = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    
    // Inverter a lógica: obter dias que NÃO estão disponíveis
    return [0, 1, 2, 3, 4, 5, 6].filter(day => 
      !selectedProfessional.availability.includes(
        Object.keys(availabilityMap).find(key => availabilityMap[key] === day) || ''
      )
    );
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white p-6 rounded-lg shadow-md"
      data-testid="appointment-form"
    >
      <h2 className="text-2xl font-bold text-primary mb-4">Agendar Serviço</h2>
      
      {!selectedService && (
        <div className="mb-4">
          <p className="text-red-500">Por favor, selecione um serviço primeiro.</p>
        </div>
      )}
      
      {selectedService && (
        <>
          <div className="mb-6">
            <p className="font-medium">Serviço selecionado:</p>
            <p className="text-primary">{selectedService.name} - {selectedService.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          
          {/* Etapa 1: Selecionar Profissional */}
          <div className={`${step !== 'select-professional' ? 'hidden' : ''}`}>
            <h3 className="text-lg font-semibold text-primary mb-3">Escolha uma profissional</h3>
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
                        {professional.specialties.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              disabledDays={getDisabledDays()}
              selectedDate={selectedDate || undefined}
              bookedDates={bookedDates}
            />
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
            
            <TimeSlotPicker 
              timeSlots={timeSlots}
              selectedTime={selectedTime}
              onSelectTime={handleTimeSelect}
            />
            
            <div className="mt-6">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={!selectedTime}
              >
                Prosseguir para Pagamento
              </button>
            </div>
          </div>
        </>
      )}
    </form>
  );
};

export default AppointmentForm;
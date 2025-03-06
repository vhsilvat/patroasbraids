import React, { useState, useEffect } from 'react';
import { Service, Professional } from '../../types/supabase';

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

const AppointmentForm: React.FC<AppointmentFormProps> = ({ selectedService, onSubmit }) => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [formData, setFormData] = useState<AppointmentData>({
    serviceId: selectedService?.id || 0,
    professionalId: 0,
    date: '',
    time: ''
  });

  // Load mock professionals
  useEffect(() => {
    // In a real implementation, we would fetch from Supabase
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

  // Update service ID when selectedService changes
  useEffect(() => {
    if (selectedService) {
      setFormData(prev => ({ ...prev, serviceId: selectedService.id }));
    }
  }, [selectedService]);

  // Generate dates for the next 30 days
  useEffect(() => {
    const dates: string[] = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Format date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      dates.push(formattedDate);
    }
    
    setAvailableDates(dates);
  }, []);

  // Generate available time slots based on selected service duration
  useEffect(() => {
    if (!selectedService) return;
    
    const times: string[] = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM
    const serviceDurationHours = selectedService.duration / 60;
    
    // If service is longer than 6 hours, only show morning slots
    const maxEndTime = serviceDurationHours > 6 ? 12 : endHour;
    
    for (let hour = startHour; hour <= maxEndTime - serviceDurationHours; hour++) {
      times.push(`${hour}:00`);
      if (hour < maxEndTime - serviceDurationHours) {
        times.push(`${hour}:30`);
      }
    }
    
    setAvailableTimes(times);
  }, [selectedService]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'serviceId' || name === 'professionalId' ? parseInt(value, 10) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.serviceId && formData.professionalId && formData.date && formData.time) {
      onSubmit(formData);
    }
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
          <div className="mb-4">
            <p className="font-medium">Serviço selecionado:</p>
            <p className="text-primary">{selectedService.name} - {selectedService.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="professionalId" className="block mb-1 font-medium">
              Profissional:
            </label>
            <select
              id="professionalId"
              name="professionalId"
              value={formData.professionalId}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
              data-testid="professional-select"
            >
              <option value="">Selecione uma profissional</option>
              {professionals.map(professional => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="date" className="block mb-1 font-medium">
              Data:
            </label>
            <select
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
              data-testid="date-select"
            >
              <option value="">Selecione uma data</option>
              {availableDates.map(date => {
                // Format date for display (DD/MM/YYYY)
                const [year, month, day] = date.split('-');
                const displayDate = `${day}/${month}/${year}`;
                
                return (
                  <option key={date} value={date}>
                    {displayDate}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="mb-6">
            <label htmlFor="time" className="block mb-1 font-medium">
              Horário:
            </label>
            <select
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
              data-testid="time-select"
            >
              <option value="">Selecione um horário</option>
              {availableTimes.map(time => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={!formData.serviceId || !formData.professionalId || !formData.date || !formData.time}
          >
            Prosseguir para Pagamento
          </button>
        </>
      )}
    </form>
  );
};

export default AppointmentForm;
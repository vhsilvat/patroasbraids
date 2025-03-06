import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ProfessionalAvailability } from '../../types/supabase';

interface DayOfWeek {
  id: number;
  name: string;
  shortName: string;
}

const daysOfWeek: DayOfWeek[] = [
  { id: 0, name: 'Domingo', shortName: 'Dom' },
  { id: 1, name: 'Segunda-feira', shortName: 'Seg' },
  { id: 2, name: 'Terça-feira', shortName: 'Ter' },
  { id: 3, name: 'Quarta-feira', shortName: 'Qua' },
  { id: 4, name: 'Quinta-feira', shortName: 'Qui' },
  { id: 5, name: 'Sexta-feira', shortName: 'Sex' },
  { id: 6, name: 'Sábado', shortName: 'Sáb' }
];

interface TimeSlot {
  startTime: string;
  endTime: string;
}

const AvailabilityManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [availabilities, setAvailabilities] = useState<ProfessionalAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    if (user && profile?.role === 'professional') {
      fetchAvailability();
    }
  }, [user, profile]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('professional_availability')
        .select('*')
        .eq('professional_id', user?.id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        throw error;
      }

      setAvailabilities(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar disponibilidades:', err);
      setError('Erro ao carregar suas disponibilidades. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDay = (dayId: number) => {
    // Buscar os horários disponíveis para este dia
    const daySlots = availabilities
      .filter((avail) => avail.day_of_week === dayId && avail.is_available)
      .map((avail) => ({
        startTime: avail.start_time,
        endTime: avail.end_time
      }));

    // Se não houver slots, iniciar com um slot vazio
    if (daySlots.length === 0) {
      setTimeSlots([{ startTime: '09:00', endTime: '18:00' }]);
    } else {
      setTimeSlots(daySlots);
    }

    setEditingDay(dayId);
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { startTime: '09:00', endTime: '18:00' }]);
  };

  const removeTimeSlot = (index: number) => {
    const newSlots = [...timeSlots];
    newSlots.splice(index, 1);
    setTimeSlots(newSlots);
  };

  const handleTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const newSlots = [...timeSlots];
    newSlots[index][field] = value;
    setTimeSlots(newSlots);
  };

  const saveAvailability = async () => {
    if (editingDay === null) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Primeiro, definir todos os slots para este dia como indisponíveis
      await supabase
        .from('professional_availability')
        .update({ is_available: false })
        .eq('professional_id', user?.id)
        .eq('day_of_week', editingDay);

      // Excluir todos os slots existentes para este dia
      await supabase
        .from('professional_availability')
        .delete()
        .eq('professional_id', user?.id)
        .eq('day_of_week', editingDay);

      // Inserir os novos slots
      if (timeSlots.length > 0) {
        const newSlots = timeSlots.map((slot) => ({
          professional_id: user?.id,
          day_of_week: editingDay,
          start_time: slot.startTime,
          end_time: slot.endTime,
          is_available: true
        }));

        const { error } = await supabase
          .from('professional_availability')
          .insert(newSlots);

        if (error) throw error;
      }

      // Buscar disponibilidade atualizada
      await fetchAvailability();
      
      setSuccess('Disponibilidade salva com sucesso!');
      setEditingDay(null);
    } catch (err: any) {
      console.error('Erro ao salvar disponibilidade:', err);
      setError('Erro ao salvar disponibilidade. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingDay(null);
    setTimeSlots([]);
  };

  const isDayAvailable = (dayId: number): boolean => {
    return availabilities.some((avail) => avail.day_of_week === dayId && avail.is_available);
  };

  const getAvailabilityText = (dayId: number): string => {
    const daySlots = availabilities.filter(
      (avail) => avail.day_of_week === dayId && avail.is_available
    );

    if (daySlots.length === 0) {
      return 'Indisponível';
    }

    return daySlots
      .map((slot) => `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`)
      .join(', ');
  };

  // Gerar opções de horários para o seletor
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Se o usuário não for um profissional, não mostrar esta seção
  if (profile?.role !== 'professional') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary">Gerenciar Disponibilidade</h2>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
          <p>{success}</p>
        </div>
      )}

      {loading && editingDay === null ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : editingDay !== null ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Editando disponibilidade: {daysOfWeek.find((day) => day.id === editingDay)?.name}
            </h3>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {timeSlots.map((slot, index) => (
            <div key={index} className="flex items-center space-x-2 mb-3">
              <select
                value={slot.startTime}
                onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                className="p-2 border border-gray-300 rounded-md"
              >
                {timeOptions.map((time) => (
                  <option key={`start-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <span>até</span>
              <select
                value={slot.endTime}
                onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                className="p-2 border border-gray-300 rounded-md"
              >
                {timeOptions.map((time) => (
                  <option key={`end-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={() => removeTimeSlot(index)}
                className="text-red-500 hover:text-red-700"
                disabled={timeSlots.length === 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}

          <div className="mt-4">
            <button
              type="button"
              onClick={addTimeSlot}
              className="text-primary hover:text-primary-dark flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Adicionar Horário
            </button>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={cancelEdit}
              className="btn border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            
            <button
              type="button"
              onClick={saveAvailability}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {daysOfWeek.map((day) => (
            <div
              key={day.id}
              className="flex justify-between items-center p-4 border border-gray-200 rounded-md"
            >
              <div>
                <h3 className="font-medium">{day.name}</h3>
                <p className={`text-sm ${isDayAvailable(day.id) ? 'text-green-600' : 'text-red-500'}`}>
                  {getAvailabilityText(day.id)}
                </p>
              </div>
              <button
                onClick={() => handleEditDay(day.id)}
                className="btn btn-primary text-sm"
              >
                Editar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailabilityManager;
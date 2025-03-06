import React from 'react';

interface TimeSlotPickerProps {
  timeSlots: { time: string; available: boolean }[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  timeSlots,
  selectedTime,
  onSelectTime
}) => {
  // Divide os horários em duas colunas
  const morningSlots = timeSlots.filter(slot => {
    const hour = parseInt(slot.time.split(':')[0]);
    return hour < 12;
  });
  
  const afternoonSlots = timeSlots.filter(slot => {
    const hour = parseInt(slot.time.split(':')[0]);
    return hour >= 12;
  });
  
  const renderTimeSlot = (slot: { time: string; available: boolean }) => {
    // Formata o horário para exibição
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      return `${hours}:${minutes}`;
    };
    
    return (
      <button
        key={slot.time}
        onClick={() => slot.available && onSelectTime(slot.time)}
        disabled={!slot.available}
        className={`
          w-full py-2 px-4 rounded border text-sm font-medium
          ${selectedTime === slot.time 
            ? 'bg-primary text-white border-primary' 
            : slot.available 
              ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
          }
        `}
        data-testid={`time-slot-${slot.time}`}
      >
        {formatTime(slot.time)}
      </button>
    );
  };
  
  return (
    <div className="w-full" data-testid="time-slot-picker">
      <h3 className="text-lg font-semibold text-primary mb-3">Horários disponíveis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Manhã */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Manhã</h4>
          <div className="space-y-2">
            {morningSlots.length > 0 ? (
              morningSlots.map(renderTimeSlot)
            ) : (
              <p className="text-sm text-gray-500">Nenhum horário disponível</p>
            )}
          </div>
        </div>
        
        {/* Tarde */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Tarde</h4>
          <div className="space-y-2">
            {afternoonSlots.length > 0 ? (
              afternoonSlots.map(renderTimeSlot)
            ) : (
              <p className="text-sm text-gray-500">Nenhum horário disponível</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotPicker;
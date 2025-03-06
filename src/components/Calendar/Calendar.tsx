import React, { useState, useEffect } from 'react';

interface CalendarProps {
  onSelectDate: (date: Date) => void;
  disabledDays?: number[]; // 0 = domingo, 1 = segunda, etc.
  selectedDate?: Date;
  bookedDates?: Date[]; // datas já reservadas
}

const Calendar: React.FC<CalendarProps> = ({ 
  onSelectDate, 
  disabledDays = [0], // domingo desativado por padrão
  selectedDate,
  bookedDates = []
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Array<{date: Date, isCurrentMonth: boolean, isDisabled: boolean, isBooked: boolean}>>([]);
  
  // Gera os dias do calendário
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Primeiro dia do mês
    const firstDayOfMonth = new Date(year, month, 1);
    // Último dia do mês
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Dia da semana do primeiro dia (0-6, onde 0 é domingo)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Total de dias a mostrar no calendário
    const totalDaysToShow = 42; // 6 semanas * 7 dias
    
    // Dias no mês anterior para completar a primeira semana
    const daysFromPrevMonth = firstDayOfWeek;
    
    // Dias do próximo mês para completar as 6 semanas
    const daysFromNextMonth = totalDaysToShow - (daysFromPrevMonth + lastDayOfMonth.getDate());
    
    const calendarDaysArray: Array<{date: Date, isCurrentMonth: boolean, isDisabled: boolean, isBooked: boolean}> = [];
    
    // Adiciona dias do mês anterior
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      
      calendarDaysArray.push({
        date,
        isCurrentMonth: false,
        isDisabled: true, // dias do mês anterior sempre desativados
        isBooked: false
      });
    }
    
    // Adiciona dias do mês atual
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(year, month, i);
      
      // Verifica se o dia da semana está desativado
      const isDayDisabled = disabledDays.includes(date.getDay());
      
      // Verifica se a data já está reservada
      const isDateBooked = bookedDates.some(bookedDate => 
        bookedDate.getDate() === date.getDate() && 
        bookedDate.getMonth() === date.getMonth() && 
        bookedDate.getFullYear() === date.getFullYear()
      );
      
      // Verifica se a data está no passado
      const isInPast = date < new Date(new Date().setHours(0, 0, 0, 0));
      
      calendarDaysArray.push({
        date,
        isCurrentMonth: true,
        isDisabled: isDayDisabled || isInPast,
        isBooked: isDateBooked
      });
    }
    
    // Adiciona dias do próximo mês
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(year, month + 1, i);
      
      calendarDaysArray.push({
        date,
        isCurrentMonth: false,
        isDisabled: true, // dias do próximo mês sempre desativados
        isBooked: false
      });
    }
    
    setCalendarDays(calendarDaysArray);
  }, [currentMonth, disabledDays, bookedDates]);
  
  // Navega para o mês anterior
  const goToPrevMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };
  
  // Navega para o próximo mês
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };
  
  // Formata a data para exibição
  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };
  
  // Compara datas sem considerar a hora
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };
  
  // Verifica se a data está selecionada
  const isDateSelected = (date: Date): boolean => {
    return selectedDate ? isSameDay(date, selectedDate) : false;
  };
  
  return (
    <div className="w-full" data-testid="calendar">
      {/* Cabeçalho com o mês e controles de navegação */}
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={goToPrevMonth}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Mês anterior"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        <h3 className="text-lg font-semibold capitalize text-primary">
          {formatMonthYear(currentMonth)}
        </h3>
        
        <button 
          onClick={goToNextMonth}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Próximo mês"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
          <div 
            key={day} 
            className={`text-center py-2 font-medium text-sm ${index === 0 ? 'text-red-500' : 'text-primary'}`}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Dias do calendário */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {calendarDays.map((day, index) => {
          const isSelected = isDateSelected(day.date);
          
          return (
            <button
              key={index}
              onClick={() => !day.isDisabled && !day.isBooked && onSelectDate(day.date)}
              disabled={day.isDisabled || day.isBooked}
              className={`
                relative h-14 p-1 bg-white transition-colors
                ${!day.isCurrentMonth ? 'text-gray-400' : ''}
                ${day.isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}
                ${day.isBooked ? 'cursor-not-allowed' : ''}
                ${isSelected ? 'ring-2 ring-primary ring-inset z-10' : ''}
              `}
              aria-label={`${day.date.getDate()} de ${day.date.toLocaleDateString('pt-BR', { month: 'long' })}`}
              aria-selected={isSelected}
              data-testid={`calendar-day-${day.date.getDate()}-${day.date.getMonth()}`}
            >
              <span className={`
                inline-flex items-center justify-center w-8 h-8 rounded-full text-sm
                ${isSelected ? 'bg-primary text-white' : ''}
                ${day.isBooked ? 'line-through' : ''}
                ${day.date.getDay() === 0 && day.isCurrentMonth ? 'text-red-500' : ''}
              `}>
                {day.date.getDate()}
              </span>
              
              {day.isBooked && (
                <span className="absolute bottom-0 inset-x-0 h-1 bg-red-400"></span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Legenda */}
      <div className="mt-4 flex justify-center items-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center">
          <span className="w-3 h-3 bg-red-400 mr-1"></span>
          <span>Indisponível</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 bg-primary mr-1"></span>
          <span>Selecionado</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
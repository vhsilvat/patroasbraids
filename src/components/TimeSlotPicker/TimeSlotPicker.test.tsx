import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TimeSlotPicker from './TimeSlotPicker';

describe('TimeSlotPicker Component', () => {
  const mockTimeSlots = [
    { time: '9:00', available: true },
    { time: '9:30', available: false },
    { time: '10:00', available: true },
    { time: '10:30', available: true },
    { time: '13:00', available: true },
    { time: '13:30', available: false },
    { time: '14:00', available: true }
  ];
  
  const mockOnSelectTime = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders available time slots correctly', () => {
    render(
      <TimeSlotPicker 
        timeSlots={mockTimeSlots} 
        selectedTime={null} 
        onSelectTime={mockOnSelectTime} 
      />
    );
    
    // Verifica se o título está presente
    expect(screen.getByText('Horários disponíveis')).toBeInTheDocument();
    
    // Verifica se as seções de manhã e tarde estão presentes
    expect(screen.getByText('Manhã')).toBeInTheDocument();
    expect(screen.getByText('Tarde')).toBeInTheDocument();
    
    // Verifica se todos os horários estão presentes
    expect(screen.getByText('9:00')).toBeInTheDocument();
    expect(screen.getByText('9:30')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('10:30')).toBeInTheDocument();
    expect(screen.getByText('13:00')).toBeInTheDocument();
    expect(screen.getByText('13:30')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
  });
  
  test('disables unavailable time slots', () => {
    render(
      <TimeSlotPicker 
        timeSlots={mockTimeSlots} 
        selectedTime={null} 
        onSelectTime={mockOnSelectTime} 
      />
    );
    
    // Botão para 9:30 deve estar desativado
    const slot930Button = screen.getByText('9:30').closest('button');
    expect(slot930Button).toBeDisabled();
    
    // Botão para 13:30 deve estar desativado
    const slot1330Button = screen.getByText('13:30').closest('button');
    expect(slot1330Button).toBeDisabled();
    
    // Botão para 10:00 deve estar ativado
    const slot1000Button = screen.getByText('10:00').closest('button');
    expect(slot1000Button).not.toBeDisabled();
  });
  
  test('shows selected time slot as selected', () => {
    render(
      <TimeSlotPicker 
        timeSlots={mockTimeSlots} 
        selectedTime="10:00" 
        onSelectTime={mockOnSelectTime} 
      />
    );
    
    // Botão para 10:00 deve ter a classe de estilo para selecionado
    const slot1000Button = screen.getByText('10:00').closest('button');
    expect(slot1000Button).toHaveClass('bg-primary');
    expect(slot1000Button).toHaveClass('text-white');
    
    // Outros botões não devem ter a classe de estilo para selecionado
    const slot900Button = screen.getByText('9:00').closest('button');
    expect(slot900Button).not.toHaveClass('bg-primary');
  });
  
  test('calls onSelectTime when a time slot is clicked', () => {
    render(
      <TimeSlotPicker 
        timeSlots={mockTimeSlots} 
        selectedTime={null} 
        onSelectTime={mockOnSelectTime} 
      />
    );
    
    // Clica no horário 10:00
    fireEvent.click(screen.getByText('10:00'));
    
    // Verifica se a função de callback foi chamada com o horário correto
    expect(mockOnSelectTime).toHaveBeenCalledWith('10:00');
  });
  
  test('does not call onSelectTime when clicking on unavailable time slots', () => {
    render(
      <TimeSlotPicker 
        timeSlots={mockTimeSlots} 
        selectedTime={null} 
        onSelectTime={mockOnSelectTime} 
      />
    );
    
    // Tenta clicar no horário 9:30 (indisponível)
    fireEvent.click(screen.getByText('9:30'));
    
    // Verifica se a função de callback não foi chamada
    expect(mockOnSelectTime).not.toHaveBeenCalled();
  });
  
  test('renders message when no slots are available', () => {
    // Array de slots vazios
    const emptyMorningSlots = [
      { time: '13:00', available: true }
    ];
    
    render(
      <TimeSlotPicker 
        timeSlots={emptyMorningSlots} 
        selectedTime={null} 
        onSelectTime={mockOnSelectTime} 
      />
    );
    
    // Deve mostrar a mensagem de "nenhum horário disponível" para a manhã
    expect(screen.getByText('Manhã')).toBeInTheDocument();
    const morningSection = screen.getByText('Manhã').closest('div');
    expect(morningSection?.textContent).toContain('Nenhum horário disponível');
  });
});
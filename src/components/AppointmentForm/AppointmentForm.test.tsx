import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppointmentForm from './AppointmentForm';
import { Service } from '../../types/supabase';

// Mock dos componentes internos para simplificar os testes
jest.mock('../Calendar/Calendar', () => {
  return function MockCalendar({ onSelectDate }: { onSelectDate: (date: Date) => void }) {
    return (
      <div data-testid="mock-calendar">
        <button 
          onClick={() => onSelectDate(new Date('2025-03-10'))}
          data-testid="select-date-button"
        >
          Selecionar dia 10
        </button>
      </div>
    );
  };
});

jest.mock('../TimeSlotPicker/TimeSlotPicker', () => {
  return function MockTimeSlotPicker({ onSelectTime }: { onSelectTime: (time: string) => void, timeSlots: any[], selectedTime: string | null }) {
    return (
      <div data-testid="mock-time-slot-picker">
        <button 
          onClick={() => onSelectTime('10:00')}
          data-testid="select-time-button"
        >
          Selecionar 10:00
        </button>
      </div>
    );
  };
});

describe('AppointmentForm Component', () => {
  const mockService: Service = {
    id: 1,
    name: 'Box Braids',
    description: 'Tranças box braids estilo tradicional',
    duration: 240, // 4 hours
    price: 250.00,
    image_url: 'https://example.com/box-braids.jpg'
  };

  const mockSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders message when no service is selected', () => {
    render(<AppointmentForm onSubmit={mockSubmit} />);
    
    expect(screen.getByText('Por favor, selecione um serviço primeiro.')).toBeInTheDocument();
  });

  test('shows service information when service is selected', () => {
    render(<AppointmentForm selectedService={mockService} onSubmit={mockSubmit} />);
    
    expect(screen.queryByText('Por favor, selecione um serviço primeiro.')).not.toBeInTheDocument();
    expect(screen.getByText('Box Braids - R$ 250,00')).toBeInTheDocument();
  });

  test('starts with professional selection step', () => {
    render(<AppointmentForm selectedService={mockService} onSubmit={mockSubmit} />);
    
    expect(screen.getByText('Escolha uma profissional')).toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Carla Oliveira')).toBeInTheDocument();
  });

  test('moves to date selection after selecting a professional', () => {
    render(<AppointmentForm selectedService={mockService} onSubmit={mockSubmit} />);
    
    // Encontra e clica no card da profissional
    const professionalCard = screen.getByTestId('professional-card-1');
    fireEvent.click(professionalCard);
    
    // Agora devemos ver o calendário
    expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    expect(screen.getByText('Escolha uma data')).toBeInTheDocument();
  });

  test('moves to time selection after selecting a date', async () => {
    render(<AppointmentForm selectedService={mockService} onSubmit={mockSubmit} />);
    
    // Seleciona a profissional
    const professionalCard = screen.getByTestId('professional-card-1');
    fireEvent.click(professionalCard);
    
    // Seleciona uma data no calendário mockado
    const selectDateButton = screen.getByTestId('select-date-button');
    fireEvent.click(selectDateButton);
    
    // Agora devemos ver o seletor de horários
    expect(screen.getByTestId('mock-time-slot-picker')).toBeInTheDocument();
  });

  test('can navigate back from date selection to professional selection', () => {
    render(<AppointmentForm selectedService={mockService} onSubmit={mockSubmit} />);
    
    // Vai para seleção de data
    const professionalCard = screen.getByTestId('professional-card-1');
    fireEvent.click(professionalCard);
    
    // Clica no botão voltar
    const backButton = screen.getByText('Voltar');
    fireEvent.click(backButton);
    
    // Devemos ver a seleção de profissional novamente
    expect(screen.getByText('Escolha uma profissional')).toBeInTheDocument();
  });

  test('can navigate back from time selection to date selection', () => {
    render(<AppointmentForm selectedService={mockService} onSubmit={mockSubmit} />);
    
    // Vai para seleção de data
    const professionalCard = screen.getByTestId('professional-card-1');
    fireEvent.click(professionalCard);
    
    // Vai para seleção de horário
    const selectDateButton = screen.getByTestId('select-date-button');
    fireEvent.click(selectDateButton);
    
    // Clica no botão voltar
    const backButton = screen.getByText('Voltar');
    fireEvent.click(backButton);
    
    // Devemos ver o calendário novamente
    expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
  });

  test('completes appointment booking process', async () => {
    render(<AppointmentForm selectedService={mockService} onSubmit={mockSubmit} />);
    
    // Seleciona a profissional
    const professionalCard = screen.getByTestId('professional-card-1');
    fireEvent.click(professionalCard);
    
    // Seleciona uma data
    const selectDateButton = screen.getByTestId('select-date-button');
    fireEvent.click(selectDateButton);
    
    // Seleciona um horário
    const selectTimeButton = screen.getByTestId('select-time-button');
    fireEvent.click(selectTimeButton);
    
    // Clica no botão de prosseguir para pagamento
    const submitButton = screen.getByText('Prosseguir para Pagamento');
    fireEvent.click(submitButton);
    
    // Verifica se onSubmit foi chamado com os dados corretos
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith({
      serviceId: 1,
      professionalId: 1,
      date: '2025-03-10',
      time: '10:00'
    });
  });

  test('disables submit button when time is not selected', () => {
    render(<AppointmentForm selectedService={mockService} onSubmit={mockSubmit} />);
    
    // Navega até o seletor de horário sem selecionar um horário
    const professionalCard = screen.getByTestId('professional-card-1');
    fireEvent.click(professionalCard);
    
    const selectDateButton = screen.getByTestId('select-date-button');
    fireEvent.click(selectDateButton);
    
    // O botão de envio deve estar desabilitado
    const submitButton = screen.getByText('Prosseguir para Pagamento');
    expect(submitButton).toBeDisabled();
  });
});
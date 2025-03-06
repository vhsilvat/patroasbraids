import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Calendar from './Calendar';

describe('Calendar Component', () => {
  const mockOnSelectDate = jest.fn();
  const today = new Date();
  
  // Avança para o próximo dia (para testar com um dia válido)
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders calendar with current month', () => {
    render(<Calendar onSelectDate={mockOnSelectDate} />);
    
    // Verifica se o mês atual está exibido
    const currentMonth = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    expect(screen.getByText(currentMonth, { exact: false })).toBeInTheDocument();
    
    // Verifica se os dias da semana estão presentes
    expect(screen.getByText('Dom')).toBeInTheDocument();
    expect(screen.getByText('Seg')).toBeInTheDocument();
    expect(screen.getByText('Ter')).toBeInTheDocument();
    expect(screen.getByText('Qua')).toBeInTheDocument();
    expect(screen.getByText('Qui')).toBeInTheDocument();
    expect(screen.getByText('Sex')).toBeInTheDocument();
    expect(screen.getByText('Sáb')).toBeInTheDocument();
  });
  
  test('allows navigation between months', () => {
    render(<Calendar onSelectDate={mockOnSelectDate} />);
    
    // Referência para o mês atual
    const currentMonth = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    // Navega para o próximo mês
    fireEvent.click(screen.getByLabelText('Próximo mês'));
    
    // Obtém o próximo mês
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthText = nextMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    // Verifica se o próximo mês está sendo exibido
    expect(screen.getByText(nextMonthText, { exact: false })).toBeInTheDocument();
    
    // Navega de volta para o mês atual
    fireEvent.click(screen.getByLabelText('Mês anterior'));
    
    // Verifica se voltou para o mês atual
    expect(screen.getByText(currentMonth, { exact: false })).toBeInTheDocument();
  });
  
  test('calls onSelectDate when a date is clicked', () => {
    // Usa um mês e ano fixos para facilitar o teste
    const testDate = new Date();
    testDate.setDate(15); // Meio do mês, certamente estará visível
    
    render(
      <Calendar 
        onSelectDate={mockOnSelectDate} 
        selectedDate={undefined}
        disabledDays={[]} // Nenhum dia desativado para o teste
      />
    );
    
    // Encontra todos os botões de dias
    const dayButtons = screen.getAllByRole('button');
    
    // Filtra para encontrar o botão para o dia 15 do mês atual
    const day15Button = dayButtons.find(button => {
      const label = button.getAttribute('aria-label');
      return label && label.includes('15 de') && !button.hasAttribute('disabled');
    });
    
    // Clica no dia 15
    if (day15Button) {
      fireEvent.click(day15Button);
      expect(mockOnSelectDate).toHaveBeenCalled();
    } else {
      fail('Não foi possível encontrar o botão para o dia 15 do mês atual');
    }
  });
  
  test('disables days as specified', () => {
    render(
      <Calendar 
        onSelectDate={mockOnSelectDate} 
        disabledDays={[0]} // Desativa domingo
      />
    );
    
    // Como os dias são renderizados em uma grade, precisamos encontrar todos os botões
    // e filtrar aqueles que correspondem aos domingos do mês atual
    const dayButtons = screen.getAllByRole('button');
    
    // Verificar que existem botões desabilitados (nossos domingos)
    const disabledButtons = dayButtons.filter(button => button.hasAttribute('disabled'));
    expect(disabledButtons.length).toBeGreaterThan(0);
  });
  
  test('shows booked dates as unavailable', () => {
    // Criar uma data para marcar como reservada (dia 20 do mês atual)
    const bookedDate = new Date(today);
    bookedDate.setDate(20);
    
    render(
      <Calendar 
        onSelectDate={mockOnSelectDate} 
        disabledDays={[]}
        bookedDates={[bookedDate]}
      />
    );
    
    // Verificar que existem botões desabilitados (nossas datas reservadas)
    const dayButtons = screen.getAllByRole('button');
    const disabledButtons = dayButtons.filter(button => button.hasAttribute('disabled'));
    expect(disabledButtons.length).toBeGreaterThan(0);
  });
});
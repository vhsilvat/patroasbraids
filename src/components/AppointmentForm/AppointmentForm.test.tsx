import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppointmentForm from './AppointmentForm';
import { Service } from '../../types/supabase';

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
    expect(screen.queryByTestId('professional-select')).not.toBeInTheDocument();
  });

  test('renders form fields when service is selected', () => {
    render(<AppointmentForm selectedService={mockService} onSubmit={mockSubmit} />);
    
    expect(screen.queryByText('Por favor, selecione um serviço primeiro.')).not.toBeInTheDocument();
    expect(screen.getByText('Box Braids - R$ 250,00')).toBeInTheDocument();
    expect(screen.getByTestId('professional-select')).toBeInTheDocument();
    expect(screen.getByTestId('date-select')).toBeInTheDocument();
    expect(screen.getByTestId('time-select')).toBeInTheDocument();
  });

  test('populates professionals dropdown', () => {
    render(<AppointmentForm selectedService={mockService} onSubmit={mockSubmit} />);
    
    const professionalSelect = screen.getByTestId('professional-select');
    expect(professionalSelect).toBeInTheDocument();
    
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Carla Oliveira')).toBeInTheDocument();
  });

  test('generates available times based on service duration', () => {
    render(<AppointmentForm selectedService={mockService} onSubmit={mockSubmit} />);
    
    const timeSelect = screen.getByTestId('time-select');
    expect(timeSelect).toBeInTheDocument();
    
    // For a 4-hour service, the latest start time should be 14:00 (to end by 18:00)
    expect(screen.getByText('9:00')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
  });

  test('submits form with appointment data when all fields are filled', async () => {
    const user = userEvent.setup();
    render(<AppointmentForm selectedService={mockService} onSubmit={mockSubmit} />);
    
    // Select professional
    await user.selectOptions(screen.getByTestId('professional-select'), '1');
    
    // Select date (first available date)
    const dateSelect = screen.getByTestId('date-select');
    await user.selectOptions(dateSelect, dateSelect.querySelector('option:not(:first-child)')!.getAttribute('value')!);
    
    // Select time (first available time)
    const timeSelect = screen.getByTestId('time-select');
    await user.selectOptions(timeSelect, '9:00');
    
    // Submit form
    await user.click(screen.getByText('Prosseguir para Pagamento'));
    
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
      serviceId: 1,
      professionalId: 1,
      time: '9:00'
    }));
  });

  test('disables submit button when not all fields are filled', () => {
    render(<AppointmentForm selectedService={mockService} onSubmit={mockSubmit} />);
    
    const submitButton = screen.getByText('Prosseguir para Pagamento');
    expect(submitButton).toBeDisabled();
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { Service } from './types/supabase';

// Mock the components
jest.mock('./components/Header/Header', () => {
  return function MockHeader() {
    return <header data-testid="mock-header">Header Component</header>;
  };
});

jest.mock('./components/ServiceList/ServiceList', () => {
  return function MockServiceList({ onSelectService }: { onSelectService: (service: Service) => void }) {
    // Add a button to simulate selecting a service
    return (
      <div data-testid="mock-service-list">
        Service List Component
        <button 
          onClick={() => onSelectService({
            id: 1,
            name: 'Test Service',
            description: 'Test Description',
            duration: 120,
            price: 100
          })}
          data-testid="select-service-button"
        >
          Select Service
        </button>
      </div>
    );
  };
});

jest.mock('./components/AppointmentForm/AppointmentForm', () => {
  return function MockAppointmentForm({ selectedService, onSubmit }: { selectedService?: Service, onSubmit: (data: any) => void }) {
    // Add a button to simulate form submission
    return (
      <div data-testid="mock-appointment-form">
        Appointment Form Component for {selectedService?.name}
        <button 
          onClick={() => onSubmit({
            serviceId: selectedService?.id,
            professionalId: 1,
            date: '2025-03-10',
            time: '10:00'
          })}
          data-testid="submit-appointment-button"
        >
          Submit Appointment
        </button>
      </div>
    );
  };
});

describe('App Component', () => {
  // Mock window.alert
  const originalAlert = window.alert;
  beforeAll(() => {
    window.alert = jest.fn();
  });
  
  afterAll(() => {
    window.alert = originalAlert;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders initial state with service selection', () => {
    render(<App />);
    
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-service-list')).toBeInTheDocument();
    expect(screen.getByText('Nossos Serviços')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-appointment-form')).not.toBeInTheDocument();
  });

  test('transitions to appointment form when service is selected', () => {
    render(<App />);
    
    // Click the "Select Service" button
    fireEvent.click(screen.getByTestId('select-service-button'));
    
    expect(screen.queryByTestId('mock-service-list')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-appointment-form')).toBeInTheDocument();
    expect(screen.getByText('Agendar Horário')).toBeInTheDocument();
  });

  test('transitions back to service selection when back button is clicked', () => {
    render(<App />);
    
    // First go to appointment form
    fireEvent.click(screen.getByTestId('select-service-button'));
    
    // Then click the back button
    fireEvent.click(screen.getByText('← Voltar para serviços'));
    
    expect(screen.getByTestId('mock-service-list')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-appointment-form')).not.toBeInTheDocument();
  });

  test('transitions to payment page when appointment is submitted', () => {
    render(<App />);
    
    // Go to appointment form
    fireEvent.click(screen.getByTestId('select-service-button'));
    
    // Submit the appointment
    fireEvent.click(screen.getByTestId('submit-appointment-button'));
    
    expect(screen.queryByTestId('mock-appointment-form')).not.toBeInTheDocument();
    expect(screen.getByText('Pagamento')).toBeInTheDocument();
    expect(window.alert).toHaveBeenCalledWith(
      'Você será redirecionado para a página de pagamento (implementação futura)'
    );
  });

  test('can return to service selection from payment page', () => {
    render(<App />);
    
    // Go through the full flow
    fireEvent.click(screen.getByTestId('select-service-button'));
    fireEvent.click(screen.getByTestId('submit-appointment-button'));
    
    // Return to start
    fireEvent.click(screen.getByText('Voltar ao Início'));
    
    expect(screen.getByTestId('mock-service-list')).toBeInTheDocument();
    expect(screen.queryByText('Pagamento')).not.toBeInTheDocument();
  });
});
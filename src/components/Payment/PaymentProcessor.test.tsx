import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PaymentProcessor from './PaymentProcessor';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock do componente MockPixPayment
jest.mock('./MockPixPayment', () => {
  return function DummyMockPixPayment(props: any) {
    return (
      <div data-testid="mock-pix-payment">
        <p>Mock PIX Payment</p>
        <p>Amount: {props.amount}</p>
        <p>Service: {props.serviceName}</p>
        <button onClick={props.onSuccess}>Simulate Success</button>
        <button onClick={props.onCancel}>Simulate Cancel</button>
      </div>
    );
  };
});

// Mock do AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: { id: 'test-user-id' },
    profile: { 
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'client'
    }
  })
}));

describe('PaymentProcessor', () => {
  const mockProps = {
    serviceId: 1,
    professionalId: 'prof-1',
    date: '2025-01-15',
    time: '10:00',
    onSuccess: jest.fn(),
    onCancel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    render(<PaymentProcessor {...mockProps} />);
    
    expect(screen.getByText(/preparando seu agendamento/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // the spinner
  });

  it('transitions to payment screen and shows MockPixPayment', async () => {
    render(<PaymentProcessor {...mockProps} />);
    
    // Deve transicionar para a tela de pagamento após o carregamento
    await waitFor(() => {
      expect(screen.getByTestId('mock-pix-payment')).toBeInTheDocument();
    });
    
    // Verificar se os props foram passados corretamente
    expect(screen.getByText(/Mock PIX Payment/)).toBeInTheDocument();
    expect(screen.getByText(/Amount:/)).toBeInTheDocument();
    expect(screen.getByText(/Service:/)).toBeInTheDocument();
  });

  it('calls onSuccess callback when payment is successful', async () => {
    render(<PaymentProcessor {...mockProps} />);
    
    // Esperar pelo componente de pagamento
    await waitFor(() => {
      expect(screen.getByTestId('mock-pix-payment')).toBeInTheDocument();
    });
    
    // Simular pagamento bem-sucedido
    fireEvent.click(screen.getByText('Simulate Success'));
    
    // Verificar se mostra a mensagem de sucesso
    expect(screen.getByText(/pagamento aprovado/i)).toBeInTheDocument();
    
    // Verificar se o callback é chamado após o delay
    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('calls onCancel callback when payment is cancelled', async () => {
    render(<PaymentProcessor {...mockProps} />);
    
    // Esperar pelo componente de pagamento
    await waitFor(() => {
      expect(screen.getByTestId('mock-pix-payment')).toBeInTheDocument();
    });
    
    // Simular cancelamento
    fireEvent.click(screen.getByText('Simulate Cancel'));
    
    // Verificar se o callback é chamado
    expect(mockProps.onCancel).toHaveBeenCalled();
  });
});
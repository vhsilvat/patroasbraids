import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MockPixPayment from './MockPixPayment';

describe('MockPixPayment', () => {
  const mockProps = {
    amount: 150.0,
    serviceName: 'Box Braids',
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
  };

  it('renders correctly with payment details', () => {
    render(<MockPixPayment {...mockProps} />);
    
    // Verificar se os elementos principais estão presentes
    expect(screen.getByText('Pagamento via PIX (Simulação)')).toBeInTheDocument();
    expect(screen.getByText(/Box Braids/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 150,00/i)).toBeInTheDocument();
    expect(screen.getByTestId('qrcode-mock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar pagamento/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('calls onSuccess when payment is confirmed', async () => {
    render(<MockPixPayment {...mockProps} />);
    
    // Clicar no botão de confirmação
    fireEvent.click(screen.getByRole('button', { name: /confirmar pagamento/i }));
    
    // Verificar se o botão fica em estado de carregamento
    expect(screen.getByText(/processando/i)).toBeInTheDocument();
    
    // Verificar se o callback onSuccess é chamado após o delay
    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('calls onCancel when payment is cancelled', () => {
    render(<MockPixPayment {...mockProps} />);
    
    // Clicar no botão de cancelamento
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    
    // Verificar se o callback onCancel é chamado
    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('disables buttons during processing', () => {
    render(<MockPixPayment {...mockProps} />);
    
    // Clicar no botão de confirmação
    fireEvent.click(screen.getByRole('button', { name: /confirmar pagamento/i }));
    
    // Verificar se ambos os botões estão desabilitados durante o processamento
    expect(screen.getByRole('button', { name: /processando/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
  });
});
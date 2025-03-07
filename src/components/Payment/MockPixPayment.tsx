import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service, Payment } from '../../types/supabase';
import { simulatePaymentApproval } from '../../lib/mercadopago';
import QRCode from 'react-qr-code';

interface MockPixPaymentProps {
  paymentId: number;
  appointmentId: number;
  service: Service;
  date: string;
  time: string;
  amount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MockPixPayment: React.FC<MockPixPaymentProps> = ({
  paymentId,
  appointmentId,
  service,
  date,
  time,
  amount,
  onSuccess,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(300); // 5 minutos em segundos
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const navigate = useNavigate();

  // Formatar valores para exibição
  const formattedAmount = amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  
  const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && !paymentConfirmed) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, paymentConfirmed]);

  // Formatar tempo restante
  const formatTimeRemaining = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Função para confirmar pagamento
  const handleConfirmPayment = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Chamar API para confirmar pagamento
      const success = await simulatePaymentApproval(paymentId);
      
      if (success) {
        setPaymentConfirmed(true);
        
        // Mostrar mensagem de sucesso por 3 segundos e redirecionar
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            navigate('/conta'); // Redirecionar para a página de conta do usuário
          }
        }, 3000);
      } else {
        throw new Error('Não foi possível confirmar o pagamento');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para cancelar pagamento
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Redirecionar para conta, mantendo o agendamento como pendente
      navigate('/conta');
    }
  };

  // Gerar uma chave PIX aleatória (mock)
  const pixKey = `${appointmentId}${Date.now()}`;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-primary mb-2">Pagamento via PIX</h2>
        <p className="text-gray-600">Escaneie o QR Code para pagar</p>
      </div>

      {/* Detalhes do agendamento */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Detalhes do Agendamento</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600">Serviço:</div>
          <div className="font-medium">{service.name}</div>
          
          <div className="text-gray-600">Data:</div>
          <div className="font-medium">{formattedDate}</div>
          
          <div className="text-gray-600">Horário:</div>
          <div className="font-medium">{time}</div>
          
          <div className="text-gray-600">Valor (50%):</div>
          <div className="font-bold text-primary">{formattedAmount}</div>
        </div>
      </div>

      {/* QR Code e chave PIX */}
      {!paymentConfirmed && (
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white border border-gray-200 rounded-lg">
              <QRCode 
                value={`00020126580014BR.GOV.BCB.PIX0136${pixKey}5204000053039865802BR5913Patroas Braids6008Sao Paulo62090505${amount.toFixed(2).replace('.', '')}6304${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`}
                size={180}
              />
            </div>
          </div>
          
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 mb-1">Chave PIX</p>
            <div className="flex items-center justify-center">
              <code className="bg-gray-100 p-2 rounded text-sm overflow-x-auto max-w-full">
                {pixKey}
              </code>
              <button 
                className="ml-2 text-primary hover:text-primary-dark"
                onClick={() => navigator.clipboard.writeText(pixKey)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Tempo para pagamento</p>
            <div className="font-mono text-lg font-bold">
              {formatTimeRemaining()}
            </div>
          </div>
        </div>
      )}

      {/* Mensagem de confirmação */}
      {paymentConfirmed && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Pagamento confirmado com sucesso! Redirecionando...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!paymentConfirmed && (
          <>
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isLoading}
              className="btn btn-primary w-full sm:w-auto flex-1"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </span>
              ) : (
                "Confirmar Pagamento"
              )}
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="btn btn-outline w-full sm:w-auto"
            >
              Fechar
            </button>
          </>
        )}
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Este é um ambiente de simulação para desenvolvimento.
          <br />
          Em produção, será integrado com o Mercado Pago.
        </p>
      </div>
    </div>
  );
};

export default MockPixPayment;
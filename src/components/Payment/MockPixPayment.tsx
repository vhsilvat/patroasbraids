import React, { useState } from 'react';

interface MockPixPaymentProps {
  amount: number;
  serviceName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const MockPixPayment: React.FC<MockPixPaymentProps> = ({
  amount,
  serviceName,
  onSuccess,
  onCancel
}) => {
  const [processing, setProcessing] = useState(false);
  
  // Gerar um código PIX simulado (apenas para visualização)
  const mockPixCode = '00020126580014BR.GOV.BCB.PIX0136a629532e-7693-4846-b028-f142082d721452048000530398654';
  
  // Função para simular a confirmação de pagamento
  const handleConfirm = () => {
    setProcessing(true);
    
    // Simular um atraso na resposta do servidor
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 2000);
  };
  
  // Formatar o valor para exibição
  const formattedAmount = amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-primary mb-4">Pagamento via PIX (Simulação)</h2>
      
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2">Resumo do pagamento</h3>
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <p><span className="font-medium">Serviço:</span> {serviceName}</p>
          <p><span className="font-medium">Valor a pagar:</span> {formattedAmount}</p>
          <p className="text-sm text-gray-500 mt-2">
            Este é um sinal de 50% do valor total do serviço.
          </p>
        </div>
      </div>
      
      <div className="border-2 border-gray-200 rounded-lg p-4 flex flex-col items-center mb-6">
        <p className="font-medium mb-3">QR Code PIX</p>
        
        {/* Simulação de QR Code */}
        <div 
          className="w-48 h-48 bg-gray-100 flex items-center justify-center mb-3"
          data-testid="qrcode-mock"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-24 h-24 text-gray-400">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <path d="M8 4v4h4V4m4 0v4h4V4M4 8v4h4V8m12 0v4h4V8M8 12v4h4v-4m4 0v4h4v-4M4 16v4h4v-4m12 0v4h4v-4"></path>
          </svg>
        </div>
        
        <div className="w-full mb-4">
          <p className="font-medium text-sm mb-1">Código PIX</p>
          <div className="relative">
            <input
              type="text"
              value={mockPixCode}
              readOnly
              className="w-full bg-gray-50 border border-gray-200 rounded p-2 pr-16 text-xs font-mono"
            />
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary text-xs font-medium"
              onClick={() => navigator.clipboard.writeText(mockPixCode)}
            >
              Copiar
            </button>
          </div>
        </div>
        
        <div className="p-3 bg-yellow-50 rounded-md w-full">
          <p className="text-sm text-yellow-800">
            <strong>Atenção:</strong> Esta é uma simulação. Em um ambiente real, você escanearia o QR Code com seu aplicativo bancário ou copiaria o código PIX.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col space-y-3">
        <button
          onClick={handleConfirm}
          disabled={processing}
          className="btn btn-primary flex items-center justify-center"
        >
          {processing ? (
            <>
              <span className="animate-spin h-5 w-5 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
              Processando...
            </>
          ) : 'Confirmar Pagamento'}
        </button>
        
        <button
          onClick={onCancel}
          disabled={processing}
          className="btn btn-outline"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default MockPixPayment;
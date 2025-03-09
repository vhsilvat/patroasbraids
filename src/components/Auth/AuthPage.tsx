import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthPageProps {
  onSuccess?: () => void;
}

type AuthView = 'login' | 'register';

const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [view, setView] = useState<AuthView>('login');
  const [authSuccess, setAuthSuccess] = useState(false);

  const handleSuccess = () => {
    console.log('AuthPage: Login bem sucedido');
    setAuthSuccess(true);
    // If there's a specific success callback, use it
    if (onSuccess) {
      console.log('AuthPage: Chamando callback onSuccess externo');
      onSuccess();
    } else {
      console.log('AuthPage: Sem callback externo, aguardando botão de continuar');
    }
  };
  
  const handleContinue = () => {
    console.log('AuthPage: Botão continuar clicado');
    // Get the URL to redirect back to if it was saved in session storage
    const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
    console.log('AuthPage: Redirecionando para', redirectUrl);
    // Clear the stored redirect URL
    sessionStorage.removeItem('redirectUrl');
    // Navigate to the stored URL or home page
    window.location.href = redirectUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        {authSuccess ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Sucesso!</h2>
            <p className="text-gray-600 mb-6">
              {view === 'login' 
                ? 'Login realizado com sucesso.' 
                : 'Sua conta foi criada com sucesso.'}
            </p>
            <button
              onClick={handleContinue}
              className="btn btn-primary w-full"
            >
              Continuar
            </button>
          </div>
        ) : view === 'login' ? (
          <LoginForm 
            onSuccess={handleSuccess}
            onRegisterClick={() => setView('register')}
          />
        ) : (
          <RegisterForm 
            onSuccess={handleSuccess}
            onLoginClick={() => setView('login')}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
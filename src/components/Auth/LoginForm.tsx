import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
}

// Ícones SVG para os botões de login social
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" width="23" height="23" className="w-5 h-5">
    <path fill="#f1511b" d="M11.5 0h-11v11h11z"/>
    <path fill="#80cc28" d="M22.5 0h-11v11h11z"/>
    <path fill="#00adef" d="M11.5 11h-11v11h11z"/>
    <path fill="#fbbc09" d="M22.5 11h-11v11h11z"/>
  </svg>
);

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onRegisterClick }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        throw error;
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      setResetSent(true);
    } catch (err: any) {
      setResetError(err.message || 'Erro ao enviar o email de recuperação');
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/conta`
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login com Google');
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/conta`
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login com Microsoft');
    }
  };

  if (showResetPassword) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">Recuperar Senha</h2>
        
        {resetError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{resetError}</p>
          </div>
        )}
        
        {resetSent ? (
          <div className="text-center">
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
              <p>Email de recuperação enviado! Verifique sua caixa de entrada.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowResetPassword(false)}
              className="text-primary hover:underline"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleResetPassword}>
              <div className="mb-4">
                <label htmlFor="resetEmail" className="block text-gray-700 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full btn btn-primary"
              >
                {resetLoading ? 'Enviando...' : 'Enviar email de recuperação'}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowResetPassword(false)}
                className="text-primary hover:underline"
              >
                Voltar para o login
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
      <h2 className="text-2xl font-bold text-primary mb-6 text-center">Login</h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
              Senha
            </label>
            <button
              type="button"
              onClick={() => setShowResetPassword(true)}
              className="text-xs text-primary hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary mb-4"
        >
          {loading ? 'Carregando...' : 'Entrar'}
        </button>
      </form>
      
      <div className="relative flex items-center justify-center mb-4">
        <div className="flex-grow h-px bg-gray-300"></div>
        <div className="mx-4 text-sm text-gray-500">ou continue com</div>
        <div className="flex-grow h-px bg-gray-300"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <button 
          type="button" 
          onClick={handleGoogleLogin}
          className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <GoogleIcon />
          <span className="ml-2">Google</span>
        </button>
        
        <button 
          type="button" 
          onClick={handleMicrosoftLogin}
          className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <MicrosoftIcon />
          <span className="ml-2">Microsoft</span>
        </button>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Não tem uma conta?{' '}
          <button
            type="button"
            onClick={onRegisterClick}
            className="text-primary hover:underline font-medium"
          >
            Registre-se
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
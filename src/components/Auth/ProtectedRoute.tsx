import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthPage from './AuthPage';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[]; // 'admin', 'professional', 'client'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { user, profile, loading } = useAuth();
  
  // Mostrar loading apenas durante a inicialização da auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não tem usuário, exibe página de login
  if (!user) {
    // Salva URL atual para redirecionamento após login
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectUrl', window.location.pathname + window.location.search);
    }
    return <AuthPage />;
  }

  // Se temos usuário mas não temos perfil (situação que não deveria ocorrer com a nova implementação)
  if (!profile) {
    console.error("Estado inválido: usuário autenticado sem perfil");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Erro de autenticação</h2>
          <p className="mb-4">Ocorreu um erro ao carregar seu perfil. Tente fazer login novamente.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Voltar para login
          </button>
        </div>
      </div>
    );
  }

  // Verificação de permissões baseada em papel
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  // Tudo ok, renderiza o conteúdo protegido
  return <>{children}</>;
};

export default ProtectedRoute;
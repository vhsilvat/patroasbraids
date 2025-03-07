import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import Header from './components/Header/Header'
import ServiceList from './components/ServiceList/ServiceList'
import AppointmentForm from './components/AppointmentForm/AppointmentForm'
import { Service } from './types/supabase'
import UserDashboard from './pages/UserDashboard'
import PaymentPage from './pages/PaymentPage'
import AuthPage from './components/Auth/AuthPage'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import { supabase } from './lib/supabase'

function Homepage() {
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  const [appointmentStep, setAppointmentStep] = useState<'select-service' | 'schedule' | 'payment'>('select-service');

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setAppointmentStep('schedule');
  };

  const handleAppointmentSubmit = (appointmentData: any) => {
    console.log('Appointment submitted:', appointmentData);
    setAppointmentStep('payment');
    // In a real implementation, we would process the appointment and redirect to payment
    alert('Você será redirecionado para a página de pagamento (implementação futura)');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {appointmentStep === 'select-service' && (
          <div>
            <h2 className="text-3xl font-bold text-primary mb-6">Nossos Serviços</h2>
            <p className="mb-6 text-gray-600">Selecione um serviço para agendar:</p>
            <ServiceList onSelectService={handleServiceSelect} />
          </div>
        )}
        
        {appointmentStep === 'schedule' && (
          <ProtectedRoute>
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-primary mb-6">Agendar Horário</h2>
              <div className="mb-4">
                <button 
                  onClick={() => setAppointmentStep('select-service')}
                  className="text-primary hover:underline"
                >
                  ← Voltar para serviços
                </button>
              </div>
              <AppointmentForm 
                selectedService={selectedService} 
                onSubmit={handleAppointmentSubmit} 
              />
            </div>
          </ProtectedRoute>
        )}
        
        {appointmentStep === 'payment' && (
          <ProtectedRoute>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-primary mb-6">Pagamento</h2>
              <p className="mb-4">Esta seção será implementada em breve com integração ao Mercado Pago.</p>
              <button 
                onClick={() => setAppointmentStep('select-service')}
                className="btn btn-primary"
              >
                Voltar ao Início
              </button>
            </div>
          </ProtectedRoute>
        )}
      </main>
      
      <footer className="bg-primary text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-secondary mb-2">Patroas Braids</h3>
              <p className="text-sm">Especialistas em cabelos afro e tranças</p>
            </div>
            
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <Link to="/conta" className="text-white hover:text-secondary transition-colors">
                Minha Conta
              </Link>
              <p className="text-sm">&copy; {new Date().getFullYear()} Patroas Braids</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Componente para proteger rotas de usuário
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profile } = useAuth();
  
  // Log para depuração
  useEffect(() => {
    console.log('PrivateRoute estado:', { 
      hasUser: !!user, 
      isLoading: loading,
      hasProfile: !!profile
    });
  }, [user, loading, profile]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Se tem usuário mas não tem perfil, também mostrar loading
  if (user && !profile) {
    console.log("PrivateRoute: Usuário autenticado mas sem perfil, mostrando loading");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Carregando seu perfil...</p>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}

// Componente para redefinição de senha
function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  
  // Escutar eventos de autenticação, especificamente PASSWORD_RECOVERY
  useEffect(() => {
    // Verificar o estado atual da autenticação quando a página é carregada
    const checkAuthSession = async () => {
      const { data } = await supabase.auth.getSession();
      // Remover console.log para evitar poluição no console
    };
    
    checkAuthSession();
    
    // Configurar o ouvinte para mudanças de estado de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Remover console.log para evitar poluição no console
      
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
      }
    });
    
    // Limpar o ouvinte quando o componente é desmontado
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Attempting to update password");
      const { data, error } = await supabase.auth.updateUser({ password });
      console.log("Update result:", data, error);
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err);
      setError(err.message || 'Erro ao redefinir a senha. Verifique se o link ainda é válido.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">Redefinir Senha</h2>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        {success ? (
          <div className="text-center">
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
              <p>Senha redefinida com sucesso!</p>
            </div>
            <Link to="/login" className="btn btn-primary">
              Ir para o login
            </Link>
          </div>
        ) : isPasswordRecovery ? (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                Nova senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={6}
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
                Confirmar nova senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={6}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? 'Redefinindo...' : 'Redefinir senha'}
            </button>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
              <p>Esta página é exclusiva para redefinição de senha.</p>
              <p>Por favor, use o link enviado ao seu email para redefinir a senha.</p>
            </div>
            <Link to="/login" className="text-primary hover:underline">
              Voltar para a página de login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/conta" element={
            <PrivateRoute>
              <UserDashboard />
            </PrivateRoute>
          } />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/agendamento" element={
            <PrivateRoute>
              <Homepage />
            </PrivateRoute>
          } />
          {/* Rota de fallback para redirecionamento em situações de erro */}
          {/* Rota para página de pagamento */}
          <Route path="/pagamento/:appointmentId" element={
            <PrivateRoute>
              <PaymentPage />
            </PrivateRoute>
          } />
          
          <Route path="/auth-error" element={
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro de Autenticação</h2>
                <p className="text-gray-600 mb-6">
                  Ocorreu um problema com sua sessão. Por favor, tente fazer login novamente.
                </p>
                <a
                  href="/login"
                  className="btn btn-primary w-full"
                  onClick={() => {
                    // Limpar totalmente o armazenamento
                    localStorage.clear();
                    sessionStorage.clear();
                  }}
                >
                  Ir para Login
                </a>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
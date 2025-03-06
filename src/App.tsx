import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import Header from './components/Header/Header'
import ServiceList from './components/ServiceList/ServiceList'
import AppointmentForm from './components/AppointmentForm/AppointmentForm'
import { Service } from './types/supabase'
import UserDashboard from './pages/UserDashboard'
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
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
  
  // Verificar se há um hash de acesso na URL (necessário para redefinir a senha)
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');
    
    // Se temos tokens na URL, vamos configurar a sessão
    if (accessToken && type === 'recovery') {
      const setSession = async () => {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
        
        if (error) {
          console.error('Erro ao configurar sessão:', error);
          setError('Link de recuperação inválido ou expirado. Por favor, solicite um novo link.');
        }
      };
      
      setSession();
    }
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
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        throw error;
      }
      
      // Se deu certo, vamos limpar o hash da URL para maior segurança
      window.history.replaceState(null, '', window.location.pathname);
      
      setSuccess(true);
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
        ) : (
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
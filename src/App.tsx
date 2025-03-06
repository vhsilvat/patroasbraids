import { useState } from 'react'
import Header from './components/Header/Header'
import ServiceList from './components/ServiceList/ServiceList'
import AppointmentForm from './components/AppointmentForm/AppointmentForm'
import { Service } from './types/supabase'

function App() {
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
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {appointmentStep === 'select-service' && (
          <div>
            <h2 className="text-3xl font-bold text-primary mb-6">Nossos Serviços</h2>
            <p className="mb-6 text-neutral-600">Selecione um serviço para agendar:</p>
            <ServiceList onSelectService={handleServiceSelect} />
          </div>
        )}
        
        {appointmentStep === 'schedule' && (
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
        )}
        
        {appointmentStep === 'payment' && (
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
        )}
      </main>
      
      <footer className="bg-primary text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-secondary mb-2">Patroas Braids</h3>
              <p className="text-sm">Especialistas em cabelos afro e tranças</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <p className="text-sm">&copy; {new Date().getFullYear()} Patroas Braids. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
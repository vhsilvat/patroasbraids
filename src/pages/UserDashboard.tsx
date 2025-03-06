import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header/Header';
import ProtectedRoute from '../components/Auth/ProtectedRoute';
import ProfileSection from '../components/User/ProfileSection';
import AppointmentsList from '../components/User/AppointmentsList';
import AvailabilityManager from '../components/Professional/AvailabilityManager';
import UserManagement from '../components/Admin/UserManagement';

const UserDashboard: React.FC = () => {
  const { profile, isAdmin, isProfessional } = useAuth();
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary">Minha Conta</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <ProfileSection />
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Lista de Agendamentos (todos os usuários) */}
              <AppointmentsList />
              
              {/* Gerenciamento de Disponibilidade (apenas profissionais) */}
              {isProfessional() && (
                <AvailabilityManager />
              )}
              
              {/* Gerenciamento de Usuários (apenas admin) */}
              {isAdmin() && (
                <UserManagement />
              )}
            </div>
          </div>
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
    </ProtectedRoute>
  );
};

export default UserDashboard;
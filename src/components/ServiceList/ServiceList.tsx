import React, { useState, useEffect } from 'react';
import { Service } from '../../types/supabase';
import ServiceCard from '../ServiceCard/ServiceCard';
import { supabase } from '../../lib/supabase';

interface ServiceListProps {
  onSelectService?: (service: Service) => void;
}

const ServiceList: React.FC<ServiceListProps> = ({ onSelectService }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, we would fetch from Supabase
        // const { data, error } = await supabase.from('services').select('*');
        
        // Mock data for development
        const mockData: Service[] = [
          {
            id: 1,
            name: 'Box Braids',
            description: 'Tranças box braids estilo tradicional',
            duration: 240,
            price: 250.00,
            image_url: 'https://example.com/box-braids.jpg'
          },
          {
            id: 2,
            name: 'Knotless Braids',
            description: 'Tranças sem nós, com aspecto mais natural',
            duration: 300,
            price: 350.00,
            image_url: 'https://example.com/knotless.jpg'
          },
          {
            id: 3,
            name: 'Twist',
            description: 'Penteado twist com mechas sintéticas',
            duration: 180,
            price: 200.00,
            image_url: 'https://example.com/twist.jpg'
          }
        ];
        
        setServices(mockData);
        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar serviços');
        setLoading(false);
        console.error('Error fetching services:', err);
      }
    };

    fetchServices();
  }, []);

  const handleSelectService = (service: Service) => {
    if (onSelectService) {
      onSelectService(service);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8" data-testid="loading">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500" data-testid="error">
        <p>{error}</p>
        <button 
          className="mt-4 btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center p-8 text-neutral-500" data-testid="empty">
        <p>Nenhum serviço disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4" data-testid="service-list">
      {services.map((service) => (
        <ServiceCard 
          key={service.id} 
          service={service} 
          onSelect={handleSelectService}
        />
      ))}
    </div>
  );
};

export default ServiceList;
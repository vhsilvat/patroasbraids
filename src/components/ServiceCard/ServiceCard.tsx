import React from 'react';
import { Service } from '../../types/supabase';

interface ServiceCardProps {
  service: Service;
  onSelect?: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSelect }) => {
  const { name, description, duration, price, image_url } = service;
  
  const handleClick = () => {
    if (onSelect) {
      onSelect(service);
    }
  };
  
  // Format duration to hours and minutes
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  };
  
  // Format price to Brazilian Real
  const formatPrice = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
      data-testid="service-card"
    >
      {image_url && (
        <div className="h-40 overflow-hidden">
          <img 
            src={image_url} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-bold text-primary mb-1">{name}</h3>
        <p className="text-neutral-600 text-sm mb-2 line-clamp-2">{description}</p>
        
        <div className="flex justify-between items-center mt-3">
          <span className="text-neutral-500 text-sm">
            <span className="inline-block w-5" aria-hidden="true">⏱</span> {formatDuration(duration)}
          </span>
          <span className="font-bold text-primary">{formatPrice(price)}</span>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
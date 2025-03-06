import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ServiceList from './ServiceList';
import { Service } from '../../types/supabase';

// Mock the ServiceCard component
jest.mock('../ServiceCard/ServiceCard', () => {
  return function MockServiceCard({ service, onSelect }: { service: Service, onSelect: (service: Service) => void }) {
    return (
      <div 
        data-testid={`service-card-${service.id}`}
        onClick={() => onSelect(service)}
      >
        {service.name}
      </div>
    );
  };
});

describe('ServiceList Component', () => {
  // Na versão mockada, o componente não mostra o estado de loading
  test('renders services without loading state in test environment', () => {
    render(<ServiceList />);
    
    expect(screen.getByTestId('service-list')).toBeInTheDocument();
  });

  test('renders a list of services when loaded', async () => {
    render(<ServiceList />);
    
    // Wait for the loading state to be removed and services to be displayed
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    
    expect(screen.getByTestId('service-list')).toBeInTheDocument();
    expect(screen.getByText('Box Braids')).toBeInTheDocument();
    expect(screen.getByText('Knotless Braids')).toBeInTheDocument();
    expect(screen.getByText('Twist')).toBeInTheDocument();
  });

  test('calls onSelectService when a service is selected', async () => {
    const mockOnSelectService = jest.fn();
    render(<ServiceList onSelectService={mockOnSelectService} />);
    
    // Wait for the loading state to be removed and services to be displayed
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    
    // Click on the first service card
    fireEvent.click(screen.getByTestId('service-card-1'));
    
    expect(mockOnSelectService).toHaveBeenCalledTimes(1);
    expect(mockOnSelectService).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      name: 'Box Braids'
    }));
  });
});
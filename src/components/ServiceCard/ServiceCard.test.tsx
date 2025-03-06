import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ServiceCard from './ServiceCard';
import { Service } from '../../types/supabase';

describe('ServiceCard Component', () => {
  const mockService: Service = {
    id: 1,
    name: 'Box Braids',
    description: 'Tranças box braids estilo tradicional',
    duration: 240, // 4 hours
    price: 250.00,
    image_url: 'https://example.com/box-braids.jpg'
  };

  test('renders service information correctly', () => {
    render(<ServiceCard service={mockService} />);
    
    expect(screen.getByText('Box Braids')).toBeInTheDocument();
    expect(screen.getByText('Tranças box braids estilo tradicional')).toBeInTheDocument();
    expect(screen.getByText('4h')).toBeInTheDocument();
    expect(screen.getByText('R$ 250,00')).toBeInTheDocument();
  });

  test('renders image when provided', () => {
    render(<ServiceCard service={mockService} />);
    
    const image = screen.getByAltText('Box Braids');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/box-braids.jpg');
  });

  test('does not render image when not provided', () => {
    const serviceWithoutImage = { ...mockService, image_url: undefined };
    render(<ServiceCard service={serviceWithoutImage} />);
    
    expect(screen.queryByAltText('Box Braids')).not.toBeInTheDocument();
  });

  test('calls onSelect callback when clicked', () => {
    const mockOnSelect = jest.fn();
    render(<ServiceCard service={mockService} onSelect={mockOnSelect} />);
    
    fireEvent.click(screen.getByTestId('service-card'));
    
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(mockService);
  });

  test('formats duration correctly for hours only', () => {
    const hourOnlyService = { ...mockService, duration: 120 }; // 2 hours
    render(<ServiceCard service={hourOnlyService} />);
    
    expect(screen.getByText('2h')).toBeInTheDocument();
  });

  test('formats duration correctly for minutes only', () => {
    const minutesOnlyService = { ...mockService, duration: 45 }; // 45 minutes
    render(<ServiceCard service={minutesOnlyService} />);
    
    expect(screen.getByText('45min')).toBeInTheDocument();
  });

  test('formats duration correctly for hours and minutes', () => {
    const mixedDurationService = { ...mockService, duration: 150 }; // 2h 30min
    render(<ServiceCard service={mixedDurationService} />);
    
    expect(screen.getByText('2h 30min')).toBeInTheDocument();
  });
});
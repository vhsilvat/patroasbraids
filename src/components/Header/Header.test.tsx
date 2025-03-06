import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from './Header';

describe('Header Component', () => {
  test('renders with default title and subtitle', () => {
    render(<Header />);
    
    expect(screen.getByText('Patroas Braids')).toBeInTheDocument();
    expect(screen.getByText('Especialistas em cabelos afro e tranças')).toBeInTheDocument();
  });

  test('renders with custom title and subtitle', () => {
    render(<Header title="Custom Title" subtitle="Custom Subtitle" />);
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Subtitle')).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    render(<Header />);
    
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Serviços')).toBeInTheDocument();
    expect(screen.getByText('Agendar')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});
import React from 'react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title = 'Patroas Braids', 
  subtitle = 'Especialistas em cabelos afro e tranças' 
}) => {
  return (
    <header className="p-4 bg-primary text-white">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary">{title}</h1>
          {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
        </div>
        <nav>
          <ul className="flex space-x-4">
            <li><a href="/" className="hover:text-secondary transition-colors">Início</a></li>
            <li><a href="/servicos" className="hover:text-secondary transition-colors">Serviços</a></li>
            <li><a href="/agendar" className="hover:text-secondary transition-colors">Agendar</a></li>
            <li><a href="/login" className="hover:text-secondary transition-colors">Login</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
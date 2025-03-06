import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title = 'Patroas Braids', 
  subtitle = 'Especialistas em cabelos afro e tranças' 
}) => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <header className="p-4 bg-primary text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <h1 className="text-3xl font-bold text-secondary">{title}</h1>
          {subtitle && <p className="text-sm mt-1 ml-2">{subtitle}</p>}
        </Link>
        <nav>
          <ul className="flex space-x-4 items-center">
            <li>
              <Link 
                to="/" 
                className={`hover:text-secondary transition-colors ${isActive('/') ? 'text-secondary' : ''}`}
              >
                Início
              </Link>
            </li>
            <li>
              <Link 
                to="/" 
                className="hover:text-secondary transition-colors"
              >
                Serviços
              </Link>
            </li>
            {user ? (
              <>
                <li>
                  <Link 
                    to="/conta" 
                    className={`hover:text-secondary transition-colors ${isActive('/conta') ? 'text-secondary' : ''}`}
                  >
                    Minha Conta
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={() => signOut()} 
                    className="bg-white text-primary px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Sair
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link 
                  to="/login" 
                  className={`bg-white text-primary px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors ${isActive('/login') ? 'bg-gray-100' : ''}`}
                >
                  Login
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
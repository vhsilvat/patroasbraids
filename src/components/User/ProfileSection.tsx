import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ProfileSection: React.FC = () => {
  const { profile, updateProfile, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!profile) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { error } = await updateProfile({ name, phone });
      
      if (error) {
        throw error;
      }
      
      setSuccess('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Formato para telefone brasileiro
  const formatPhone = (input: string) => {
    // Remove todos os caracteres não numéricos
    const numbersOnly = input.replace(/\D/g, '');
    
    // Aplica a formatação
    if (numbersOnly.length <= 2) {
      return numbersOnly;
    } else if (numbersOnly.length <= 6) {
      return `(${numbersOnly.slice(0, 2)}) ${numbersOnly.slice(2)}`;
    } else if (numbersOnly.length <= 10) {
      return `(${numbersOnly.slice(0, 2)}) ${numbersOnly.slice(2, 6)}-${numbersOnly.slice(6)}`;
    } else {
      return `(${numbersOnly.slice(0, 2)}) ${numbersOnly.slice(2, 7)}-${numbersOnly.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'professional':
        return 'Profissional';
      case 'client':
        return 'Cliente';
      default:
        return role;
    }
  };

  // Gerar URL de avatar padrão baseado no nome do usuário
  const getDefaultAvatar = () => {
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=8B5CF6&color=fff&size=200`;
    return profile.photo_url || fallbackUrl;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary">Perfil</h2>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-primary text-sm"
          >
            Editar Perfil
          </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
          <p>{success}</p>
        </div>
      )}

      {/* Foto do perfil */}
      <div className="flex justify-center mb-6">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary">
          <img 
            src={getDefaultAvatar()} 
            alt={`Foto de ${profile.name}`}
            className="w-full h-full object-cover" 
          />
        </div>
      </div>
      
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">
              Nome
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={profile.email}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="phone" className="block text-gray-700 text-sm font-medium mb-2">
              Telefone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setName(profile.name);
                setPhone(profile.phone || '');
                setError(null);
                setSuccess(null);
              }}
              className="btn border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Nome</h3>
            <p className="text-lg">{profile.name}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Email</h3>
            <p className="text-lg">{profile.email}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Telefone</h3>
            <p className="text-lg">{profile.phone || 'Não informado'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Tipo de conta</h3>
            <p className="text-lg">{getRoleLabel(profile.role)}</p>
          </div>
          
          <div className="pt-4 border-t border-gray-200 mt-6">
            <button
              onClick={() => {
                try {
                  signOut();
                } catch (e) {
                  // Força logout em caso de erro
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/';
                }
              }}
              className="btn border border-red-300 bg-white text-red-600 hover:bg-red-50"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;
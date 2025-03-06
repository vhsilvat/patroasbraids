import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../contexts/AuthContext';

interface UserData {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  created_at?: string;
}

const UserManagement: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [role, setRole] = useState<UserRole>('client');

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchUsers();
    }
  }, [profile]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      setError('Erro ao carregar lista de usuários. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setRole(user.role);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Atualizar o perfil do usuário
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', editingUser.id);

      if (error) {
        throw error;
      }

      // Se usuário for promovido a profissional, verificar se já existe um registro na tabela de profissionais
      if (role === 'professional') {
        // Verificar se já existe
        const { data: existingProfessional } = await supabase
          .from('professionals')
          .select('id')
          .eq('user_id', editingUser.id)
          .maybeSingle();

        // Se não existe, criar entrada
        if (!existingProfessional) {
          const { error: profError } = await supabase
            .from('professionals')
            .insert({
              id: editingUser.id,
              user_id: editingUser.id,
              name: editingUser.name,
              specialties: [],
              availability: []
            });

          if (profError) {
            throw profError;
          }
        }
      }

      setSuccess(`Permissões de ${editingUser.name} atualizadas com sucesso!`);
      setEditingUser(null);
      
      // Atualizar lista de usuários
      await fetchUsers();
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err);
      setError(`Erro ao atualizar permissões de ${editingUser.name}. Tente novamente.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Se o usuário não for um administrador, não mostrar esta seção
  if (profile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary">Gerenciamento de Usuários</h2>
        <button
          onClick={fetchUsers}
          className="text-primary hover:text-primary-dark"
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
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

      {loading && !editingUser ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : editingUser ? (
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold text-lg">{editingUser.name}</h3>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600">{editingUser.email}</p>
            <p className="text-gray-500 text-sm">Criado em: {formatDate(editingUser.created_at)}</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Tipo de Acesso
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  id="role-client"
                  name="role"
                  type="radio"
                  value="client"
                  checked={role === 'client'}
                  onChange={() => setRole('client')}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <label htmlFor="role-client" className="ml-2 block text-sm text-gray-700">
                  Cliente
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="role-professional"
                  name="role"
                  type="radio"
                  value="professional"
                  checked={role === 'professional'}
                  onChange={() => setRole('professional')}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <label htmlFor="role-professional" className="ml-2 block text-sm text-gray-700">
                  Profissional
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="role-admin"
                  name="role"
                  type="radio"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={() => setRole('admin')}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <label htmlFor="role-admin" className="ml-2 block text-sm text-gray-700">
                  Administrador
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="btn border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            
            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={loading || role === editingUser.role}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Cadastro
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                        user.role === 'professional' ? 'bg-green-100 text-green-800' : 
                        'bg-blue-100 text-blue-800'}`}
                    >
                      {user.role === 'admin' ? 'Administrador' : 
                       user.role === 'professional' ? 'Profissional' : 'Cliente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-primary hover:text-primary-dark"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum usuário encontrado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserManagement;
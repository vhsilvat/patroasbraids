import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'professional' | 'client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  photo_url?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signInWithOAuth: (provider: 'google' | 'azure') => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<{ 
    error: any | null, 
    user: User | null,
    needsEmailConfirmation?: boolean 
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  updatePassword: (password: string) => Promise<{ error: any | null }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: any | null }>;
  isAdmin: () => boolean;
  isProfessional: () => boolean;
  isClient: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Função para criar um perfil local a partir do usuário
  const createLocalProfile = (user: User): UserProfile => {
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';
    const email = user.email || '';
    
    return {
      id: user.id,
      email,
      name,
      role: 'client', // default role
      photo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B5CF6&color=fff&size=200`
    };
  };

  // Simplificação - sem consultar perfil do banco
  const updateUserState = (currentUser: User | null, currentSession: Session | null) => {
    setUser(currentUser);
    setSession(currentSession);
    
    if (currentUser) {
      // Sempre usar um perfil local em vez de buscar do banco
      setProfile(createLocalProfile(currentUser));
    } else {
      setProfile(null);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    console.log("🔑 Inicializando AuthContext...");
    
    // Obter sessão inicial
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Erro ao obter sessão:", error.message);
          updateUserState(null, null);
          return;
        }
        
        if (data?.session) {
          console.log("✅ Sessão encontrada para usuário:", data.session.user.email);
          updateUserState(data.session.user, data.session);
        } else {
          console.log("ℹ️ Nenhuma sessão ativa encontrada");
          updateUserState(null, null);
        }
      } catch (err) {
        console.error("❌ Erro inesperado:", err);
        updateUserState(null, null);
      }
    };

    initializeAuth();

    // Ouvir mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log(`🔄 Evento de autenticação: ${event}`);
      
      if (currentSession) {
        console.log(`✅ Usuário autenticado: ${currentSession.user.email}`);
        updateUserState(currentSession.user, currentSession);
      } else {
        console.log("❌ Usuário desautenticado");
        updateUserState(null, null);
      }
    });

    // Limpeza
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Métodos de autenticação simplificados
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) return { error };
      
      // updateUserState é chamado automaticamente pelo listener onAuthStateChange
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      // Não finalizamos o loading aqui, pois o onAuthStateChange cuidará disso
    }
  };
  
  const signInWithOAuth = async (provider: 'google' | 'azure') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/conta`
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name: userData.name,
            role: 'client'
          },
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) return { error, user: null };
      
      return { 
        error: null, 
        user: data.user,
        needsEmailConfirmation: !data.user?.email_confirmed_at 
      };
    } catch (error) {
      return { error, user: null };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      // Limpeza manual (o listener também irá atualizar)
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Limpar localStorage e cookies para garantir
      localStorage.removeItem('sb-pnvzauzhrehdzhwzfnjt-auth-token');
      document.cookie.split(';').forEach(c => {
        document.cookie = c.trim().split('=')[0] + '=;' + 'expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
      });
      
      // Redirecionar para garantir limpeza total
      window.location.href = '/';
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Abordagem brutal se falhar
      localStorage.clear();
      window.location.href = '/';
    }
  };
  
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };
  
  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Método simulado - armazena apenas em memória, não tenta persistir
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }
    
    try {
      // Apenas atualiza o estado local, não tenta salvar no banco
      setProfile(prev => prev ? { ...prev, ...data } : null);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const isAdmin = () => profile?.role === 'admin';
  const isProfessional = () => profile?.role === 'professional';
  const isClient = () => profile?.role === 'client';

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signInWithOAuth,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    isAdmin,
    isProfessional,
    isClient
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
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

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setLoading(true);
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Primeiro, verificar se o perfil existe
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {  // Perfil não encontrado
          // Tentar criar o perfil se não existir
          const userData = await supabase.auth.getUser();
          
          if (userData && userData.data && userData.data.user) {
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: userId,
                  email: userData.data.user.email,
                  name: userData.data.user.user_metadata?.name || userData.data.user.email,
                  role: 'client' // Perfil padrão para usuários novos
                }
              ])
              .select()
              .single();
            
            if (insertError) {
              console.error('Error creating profile:', insertError);
              return;
            }
            
            setProfile(newProfile as UserProfile);
            return;
          }
        }
        console.error('Error fetching user profile:', error);
        return;
      }
      
      setProfile(data as UserProfile);
    } catch (err) {
      console.error('Unexpected error in fetchUserProfile:', err);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };
  
  const signInWithOAuth = async (provider: 'google' | 'azure') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/conta`
      }
    });
    return { error };
  };

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    // First create the auth user - always set role to 'client'
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          name: userData.name,
          role: 'client' // Always client role for new users
        },
        emailRedirectTo: window.location.origin // Redireciona de volta para o app após confirmação
      }
    });
    
    if (error || !data.user) {
      return { error, user: null };
    }
    
    // Verificar se o usuário precisa de confirmação de email
    const needsEmailConfirmation = !data.user.email_confirmed_at;
    
    // Esperar um momento para garantir que o usuário foi criado
    // O gatilho no Supabase criará o perfil automaticamente
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { 
      error: needsEmailConfirmation 
        ? { message: 'Verifique seu email para confirmar o cadastro antes de fazer login' } 
        : null, 
      user: data.user,
      needsEmailConfirmation 
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };
  
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };
  
  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }
    
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);
    
    if (!error) {
      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...data } : null);
    }
    
    return { error };
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
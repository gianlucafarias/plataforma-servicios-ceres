'use client';

import { createContext, useContext, ReactNode } from 'react';
import { User, RegisterFormData } from '@/types';
import { signIn, signOut, useSession } from 'next-auth/react';
import { registerUser } from '@/lib/api/auth';
import { getDashboardProfile } from '@/lib/api/dashboard';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  profile: () => Promise<{ id: string } | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const user = (session?.user as User) ?? null;
  const loading = status === 'loading';

  const login = async (email: string, password: string) => {
    const response = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (response?.error) {
      throw new Error(response.error);
    }

    if (response?.ok) {
      return;
    }

    throw new Error('Error al iniciar sesiÃ³n');
  };

  const register = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const profile = async () => {
    return getDashboardProfile();
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    profile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

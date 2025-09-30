'use client';

import { createContext, useContext, ReactNode } from 'react';
import { User, RegisterFormData } from '@/types';
import { signIn, signOut, useSession } from 'next-auth/react';


interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  profile: () => Promise<User | null>;
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
      // La sesión se actualizará automáticamente y se reflejará en el efecto useEffect
      return;
    } else {
      throw new Error('Error al iniciar sesión');
    }
  };

  const register = async (data: RegisterFormData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let message = 'Error al registrar usuario';
        try {
          const error = await response.json();
          message = error?.error || error?.message || message;
        } catch {}
        throw new Error(message);
      }

      // Registro exitoso: no iniciar sesión automáticamente.
      // El usuario debe verificar su email antes de poder iniciar sesión.
      await response.json();
      
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
    } finally {
      // La sesión se limpiará por NextAuth
    }
  };

  const profile = async () => {
    const response = await fetch('/api/professional/me');
    const json = await response.json();
    return json.data;
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
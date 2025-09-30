'use client';

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/hooks/useAuth";
import { ReactNode } from "react";
import { Session } from "next-auth";

interface AuthProvidersProps {
  children: ReactNode;
  session: Session | null;
}

export function AuthProviders({ children, session }: AuthProvidersProps) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false} refetchInterval={0}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  );
}
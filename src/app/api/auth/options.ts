import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from 'bcryptjs'
import { AuthOptions } from 'next-auth'
import { prisma } from '@/lib/prisma'

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    firstName?: string
    lastName?: string
    
  }
  
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      firstName?: string
      lastName?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    firstName?: string
    lastName?: string
  }
}


export const authOptions: AuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email as string }
                    })

                    if (!user) return null

                    if (!user.verified) {
                        // Rechazar login si la cuenta no está verificada
                        return null
                    }

                    const passwordsMatch = await bcrypt.compare(
                        credentials.password as string, 
                        user.password
                    )

                    if (!passwordsMatch) return null

                    return {
                        id: user.id.toString(),
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`,
                        firstName: user.firstName,
                        lastName: user.lastName,
                    }
                } catch (error) {
                    console.error('Error en autenticación:', error)
                    return null
                }
            }
        })
    ],
    debug: process.env.NODE_ENV === 'development',
    pages: {
        signIn: '/auth/login',
        error: '/auth/error',
    },
    session: {
        strategy: "jwt"
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.firstName = user.firstName
                token.lastName = user.lastName
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id
                session.user.firstName = token.firstName
                session.user.lastName = token.lastName
            }
            return session
        }
    }
}
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
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
      image?: string
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
        // Google OAuth
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        // Facebook OAuth
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
        }),
        // Credentials (email/password)
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

                    // Si el usuario no tiene password (es OAuth), rechazar
                    if (!user.password) {
                        throw new Error('Esta cuenta usa login social. Iniciá sesión con Google o Facebook.')
                    }

                    if (!user.verified) {
                        throw new Error('Tu cuenta aún no ha sido verificada. Te notificaremos por email cuando sea aprobada.')
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
                    if (error instanceof Error) {
                        throw error
                    }
                    return null
                }
            }
        })
    ],
    debug: process.env.NODE_ENV === 'development',
    pages: {
        signIn: '/auth/login',
        error: '/auth/login',
    },
    session: {
        strategy: "jwt"
    },
    callbacks: {
        async signIn({ user, account }) {
            // Solo manejar OAuth (Google, Facebook)
            if (account?.provider === 'google' || account?.provider === 'facebook') {
                try {
                    const email = user.email
                    if (!email) {
                        console.error('OAuth: No email provided')
                        return false
                    }

                    console.log('OAuth signIn iniciado para:', email, 'provider:', account.provider)

                    // Buscar usuario existente
                    let dbUser = await prisma.user.findUnique({
                        where: { email }
                    })

                    if (dbUser) {
                        console.log('Usuario existente encontrado:', dbUser.id)
                        
                        // Verificar si ya tiene esta cuenta OAuth vinculada
                        try {
                            const existingAccount = await prisma.account.findUnique({
                                where: {
                                    provider_providerAccountId: {
                                        provider: account.provider,
                                        providerAccountId: account.providerAccountId
                                    }
                                }
                            })

                            if (!existingAccount) {
                                console.log('Vinculando nueva cuenta OAuth')
                                // Vincular nueva cuenta OAuth al usuario existente
                                await prisma.account.create({
                                    data: {
                                        userId: dbUser.id,
                                        type: account.type,
                                        provider: account.provider,
                                        providerAccountId: account.providerAccountId,
                                        access_token: account.access_token,
                                        refresh_token: account.refresh_token,
                                        expires_at: account.expires_at,
                                        token_type: account.token_type,
                                        scope: account.scope,
                                        id_token: account.id_token,
                                        session_state: account.session_state as string | null,
                                    }
                                })
                            } else {
                                console.log('Cuenta OAuth ya existe')
                            }
                        } catch (accountError) {
                            console.error('Error al manejar cuenta OAuth:', accountError)
                            // Continuar aunque falle la vinculación de cuenta
                        }

                        // Actualizar datos del usuario (verificación + imagen de perfil)
                        try {
                            const updateData: { verified?: boolean; emailVerifiedAt?: Date; image?: string } = {}
                            
                            if (!dbUser.verified) {
                                updateData.verified = true
                                updateData.emailVerifiedAt = new Date()
                            }
                            
                            // Actualizar imagen de perfil si el usuario no tiene una o si cambió
                            if (user.image && (!dbUser.image || dbUser.image !== user.image)) {
                                updateData.image = user.image
                            }
                            
                            if (Object.keys(updateData).length > 0) {
                                console.log('Actualizando usuario:', updateData)
                                await prisma.user.update({
                                    where: { id: dbUser.id },
                                    data: updateData
                                })
                            }
                        } catch (updateError) {
                            console.error('Error al actualizar usuario:', updateError)
                            // Continuar aunque falle la actualización
                        }
                    } else {
                        console.log('Creando nuevo usuario OAuth')
                        // Usuario no existe - crear nuevo usuario y cuenta OAuth
                        const nameParts = (user.name || '').split(' ')
                        const firstName = nameParts[0] || 'Usuario'
                        const lastName = nameParts.slice(1).join(' ') || ''

                        dbUser = await prisma.user.create({
                            data: {
                                email,
                                firstName,
                                lastName,
                                name: user.name,
                                image: user.image,
                                verified: true, // OAuth ya verificó el email
                                emailVerifiedAt: new Date(),
                                role: 'citizen', // Usuarios OAuth empiezan como ciudadanos
                                accounts: {
                                    create: {
                                        type: account.type,
                                        provider: account.provider,
                                        providerAccountId: account.providerAccountId,
                                        access_token: account.access_token,
                                        refresh_token: account.refresh_token,
                                        expires_at: account.expires_at,
                                        token_type: account.token_type,
                                        scope: account.scope,
                                        id_token: account.id_token,
                                        session_state: account.session_state as string | null,
                                    }
                                }
                            }
                        })
                        console.log('Usuario creado:', dbUser.id)
                    }

                    console.log('OAuth signIn completado exitosamente')
                    return true
                } catch (error) {
                    console.error('Error en signIn OAuth:', error)
                    // Log detallado para debugging
                    if (error instanceof Error) {
                        console.error('Error message:', error.message)
                        console.error('Error stack:', error.stack)
                    }
                    // Retornar false para que NextAuth muestre el error
                    return false
                }
            }
            
            return true
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id
                token.firstName = user.firstName
                token.lastName = user.lastName
                token.picture = user.image
            }
            
            // Para usuarios OAuth, obtener datos de la DB (solo en el primer login)
            if (account?.provider === 'google' || account?.provider === 'facebook') {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { email: token.email as string }
                    })
                    if (dbUser) {
                        token.id = dbUser.id
                        token.firstName = dbUser.firstName
                        token.lastName = dbUser.lastName
                        token.picture = dbUser.image || token.picture
                    }
                } catch (error) {
                    console.error('Error en jwt callback:', error)
                    // Continuar con los datos del token aunque falle la consulta
                }
            }
            
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id
                session.user.firstName = token.firstName
                session.user.lastName = token.lastName
                session.user.image = token.picture as string | undefined
            }
            return session
        }
    }
}

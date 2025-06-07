import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'

const isDevelopment = process.env.NODE_ENV === 'development'

// Debug environment variables only in development
if (isDevelopment) {
  console.log('NextAuth Environment Check:')
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing')
  console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing')
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
}

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  debug: isDevelopment,
  logger: isDevelopment ? {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', code, metadata)
    }
  } : undefined,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (isDevelopment) {
        console.log('🔥 NextAuth signIn callback triggered')
        console.log('Provider:', account?.provider)
        console.log('User from Google:', user)
        console.log('Account:', account)
        console.log('Profile:', profile)
      }
      
      if (account?.provider === 'google') {
        try {
          if (isDevelopment) {
            console.log('✅ Google provider detected')
            console.log('Google Access Token:', account.access_token ? 'Present' : 'Missing')
            console.log('🔄 Calling backend to create/update user...')
          }
          
          let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
          
          // Force HTTPS for Railway URLs
          if (apiUrl.includes('railway.app') && apiUrl.startsWith('http://')) {
            apiUrl = apiUrl.replace('http://', 'https://')
          }
          
          if (isDevelopment) {
            console.log('🌐 Using API URL:', apiUrl)
          }
          
          const response = await fetch(`${apiUrl}/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: account.access_token,
            }),
          })

          if (isDevelopment) {
            console.log('🌐 Backend auth response status:', response.status)
          }
          
          if (response.ok) {
            const data = await response.json()
            if (isDevelopment) {
              console.log('✅ Backend auth response data:', data)
            }
            
            // Store the database user ID - this is the critical part!
            user.id = data.user.id.toString()
            user.email = data.user.email
            user.name = data.user.name
            user.databaseUserId = data.user.id.toString()
            
            if (isDevelopment) {
              console.log('✅ Set user.id to database ID:', user.id)
              console.log('✅ Set user.databaseUserId to:', user.databaseUserId)
            }
            return true
          } else {
            const errorText = await response.text()
            if (isDevelopment) {
              console.error('❌ Backend auth failed:', response.status, errorText)
            }
            return false
          }
        } catch (error) {
          if (isDevelopment) {
            console.error('❌ Error during sign in:', error)
          }
          return false
        }
      }
      
      if (isDevelopment) {
        console.log('❌ Non-Google provider or missing account:', account?.provider)
      }
      return false  // Only allow Google auth
    },
    async session({ session, token }) {
      if (isDevelopment) {
        console.log('📋 Session callback triggered')
        console.log('📋 Token:', token)
        console.log('📋 Session before modification:', session)
      }
      
      // Use the database user ID from the token
      if (token.databaseUserId && session.user) {
        session.user.id = token.databaseUserId
        if (isDevelopment) {
          console.log('📋 Set session.user.id to database ID:', session.user.id)
        }
      } else if (token.sub && session.user) {
        // Fallback to token.sub if databaseUserId is not available
        session.user.id = token.sub
        if (isDevelopment) {
          console.log('📋 Fallback: Set session.user.id to token.sub:', session.user.id)
        }
      }
      
      if (isDevelopment) {
        console.log('📋 Session after modification:', session)
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (isDevelopment) {
        console.log('🔑 JWT callback triggered')
        console.log('🔑 User in JWT callback:', user)
        console.log('🔑 Token before modification:', token)
      }
      
      // Store the database user ID in the token when user signs in
      if (user) {
        token.databaseUserId = user.databaseUserId || user.id
        token.sub = user.databaseUserId || user.id
        if (isDevelopment) {
          console.log('🔑 Stored databaseUserId in token:', token.databaseUserId)
          console.log('🔑 Set token.sub to:', token.sub)
        }
      }
      
      if (isDevelopment) {
        console.log('🔑 Token after modification:', token)
      }
      return token
    }
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)

export const GET = handler
export const POST = handler 
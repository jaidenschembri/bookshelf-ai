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
      if (account?.provider === 'google') {
        try {
          let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
          
          // Force HTTPS for Railway URLs - robust enforcement
          if (apiUrl.includes('railway.app')) {
            // Remove any existing protocol and force HTTPS
            apiUrl = apiUrl.replace(/^https?:\/\//, '')
            apiUrl = 'https://' + apiUrl
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
          
          if (response.ok) {
            const data = await response.json()
            
            // Store the database user ID and JWT token - this is the critical part!
            user.id = data.user.id.toString()
            user.email = data.user.email
            user.name = data.user.name
            user.databaseUserId = data.user.id.toString()
            user.accessToken = data.access_token // Store the JWT token
            
            return true
          } else {
            const errorText = await response.text()
            console.error('Backend auth failed:', response.status, errorText)
            return false
          }
        } catch (error) {
          console.error('Error during sign in:', error)
          return false
        }
      }
      
      return false  // Only allow Google auth
    },
    async session({ session, token }) {
      // Use the database user ID from the token
      if (token.databaseUserId && session.user) {
        session.user.id = token.databaseUserId
        session.accessToken = token.accessToken // Include JWT token in session
      } else if (token.sub && session.user) {
        // Fallback to token.sub if databaseUserId is not available
        session.user.id = token.sub
      }
      
      return session
    },
    async jwt({ token, user, account }) {
      // Store the database user ID and JWT token in the token when user signs in
      if (user) {
        token.databaseUserId = user.databaseUserId || user.id
        token.sub = user.databaseUserId || user.id
        token.accessToken = user.accessToken // Store JWT token
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
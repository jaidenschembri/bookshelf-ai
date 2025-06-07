import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
    accessToken?: string
  }

  interface User {
    id: string
    databaseUserId?: string
    accessToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string
    databaseUserId?: string
    accessToken?: string
  }
} 
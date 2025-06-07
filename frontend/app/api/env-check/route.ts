import { NextResponse } from 'next/server'

export async function GET() {
  // Only show this in development or if explicitly enabled
  const isDev = process.env.NODE_ENV === 'development'
  const showEnvCheck = process.env.SHOW_ENV_CHECK === 'true'
  
  if (!isDev && !showEnvCheck) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'Set' : 'Missing',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'Not set',
    timestamp: new Date().toISOString()
  })
} 
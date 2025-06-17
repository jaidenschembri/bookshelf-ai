import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import { PageErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Libraria - Smart Book Recommendations',
  description: 'Discover your next favorite book with AI-powered personalized recommendations',
  keywords: ['books', 'reading', 'recommendations', 'AI', 'library'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <PageErrorBoundary>
          <Providers>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#000000',
                  color: '#ffffff',
                  border: '4px solid #000000',
                  borderRadius: '0',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                },
              }}
            />
          </Providers>
        </PageErrorBoundary>
      </body>
    </html>
  )
} 
'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BookOpen, ArrowRight } from 'lucide-react'
import AuthModal from '@/components/AuthModal'
import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  CTASection
} from '@/components/marketing'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16 bg-gray-900 rounded flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-white animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <span className="text-xl font-semibold font-serif tracking-tight">Bookshelf AI</span>
                <div className="text-xs text-gray-500">AI-Powered Reading</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => openAuthModal('signin')}
                className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2"
              >
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="bg-white">
        <HeroSection onGetStarted={() => openAuthModal('signup')} />

        {/* Features Section */}
        <FeaturesSection />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* CTA Section */}
        <CTASection onButtonClick={() => openAuthModal('signup')} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 mr-3 text-gray-600" />
              <span className="font-serif font-semibold text-xl">Bookshelf AI</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Literature Meets Technology • Discover • Read • Repeat
            </p>
            <p className="text-xs text-gray-500">
              © 2024 Bookshelf AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </div>
  )
} 
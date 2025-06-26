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
              <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-16 h-16 bg-blue-600 rounded-xl shadow-lg flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-white animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="content-container">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-xl shadow-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <span className="text-xl font-semibold font-serif tracking-tight text-slate-800">Libraria</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => openAuthModal('signin')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg flex items-center space-x-2"
              >
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="bg-slate-50">
        <HeroSection onGetStarted={() => openAuthModal('signup')} />

        {/* Features Section */}
        <FeaturesSection />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* CTA Section */}
        <CTASection onButtonClick={() => openAuthModal('signup')} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 shadow-sm">
        <div className="content-container py-16">
          <div className="text-center component-spacing">
            <div className="flex items-center justify-center mb-6">
              <BookOpen className="h-6 w-6 mr-3 text-slate-500" />
                              <span className="font-serif font-semibold text-xl text-slate-700">Libraria</span>
            </div>
            <p className="text-body mb-6">
              Track • Share • Discover • Connect with Fellow Readers
            </p>
            <p className="text-caption text-slate-400">
                              © 2024 Libraria. All rights reserved.
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
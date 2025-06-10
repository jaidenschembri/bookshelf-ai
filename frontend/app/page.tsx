'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BookOpen, Brain, Star, TrendingUp, ArrowRight, Zap, Target, Users } from 'lucide-react'
import AuthModal from '@/components/AuthModal'

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
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold font-serif tracking-tight mb-8">
                Discover Your Next<br />
                <span className="text-gray-600">Favorite Book</span>
              </h1>
              
              <div className="max-w-2xl mx-auto mb-12">
                <p className="text-lg text-gray-600 mb-8">
                  Get personalized book recommendations powered by artificial intelligence. 
                  Track your reading progress, rate books, and let our intelligent system 
                  suggest your next great literary adventure.
                </p>
                <div className="border-l-4 border-gray-300 pl-6 py-4 bg-gray-50 rounded-r">
                  <p className="text-lg italic font-serif text-gray-700">
                    "A reader lives a thousand lives before he dies... The man who never reads lives only one."
                  </p>
                  <p className="text-sm text-gray-500 mt-2">— George R.R. Martin</p>
                </div>
              </div>
              
              <div className="flex justify-center mb-16">
                <button
                  onClick={() => openAuthModal('signup')}
                  className="bg-gray-900 text-white px-8 py-4 rounded text-lg font-medium hover:bg-gray-800 transition-colors flex items-center space-x-3"
                >
                  <span>Get Started Free</span>
                  <Zap className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-serif tracking-tight mb-6">Powerful Features</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need to discover, track, and enjoy your reading journey
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="border border-gray-200 p-6 rounded bg-white">
                <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center mb-6">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold font-serif mb-4">AI-Powered Recommendations</h3>
                <p className="text-gray-600">
                  Our advanced artificial intelligence analyzes your reading history, 
                  preferences, and ratings to suggest books you'll absolutely love.
                </p>
              </div>
              
              <div className="border border-gray-200 p-6 rounded bg-white">
                <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center mb-6">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold font-serif mb-4">Reading Progress Tracking</h3>
                <p className="text-gray-600">
                  Set reading goals, monitor your progress with visual charts, 
                  and celebrate your literary achievements along the way.
                </p>
              </div>
              
              <div className="border border-gray-200 p-6 rounded bg-white">
                <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center mb-6">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold font-serif mb-4">Rate & Review System</h3>
                <p className="text-gray-600">
                  Rate books, write detailed reviews, and help improve your 
                  personalized recommendations with every interaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-serif tracking-tight mb-6">How It Works</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Four simple steps to unlock your personalized reading experience
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-900 text-white rounded flex items-center justify-center mx-auto mb-6 text-xl font-bold font-serif">
                  01
                </div>
                <h4 className="text-lg font-semibold font-serif mb-3">Sign In</h4>
                <p className="text-gray-600">
                  Create your account securely with Google OAuth authentication
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-900 text-white rounded flex items-center justify-center mx-auto mb-6 text-xl font-bold font-serif">
                  02
                </div>
                <h4 className="text-lg font-semibold font-serif mb-3">Add Books</h4>
                <p className="text-gray-600">
                  Search our extensive database and add books you've read or want to read
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-900 text-white rounded flex items-center justify-center mx-auto mb-6 text-xl font-bold font-serif">
                  03
                </div>
                <h4 className="text-lg font-semibold font-serif mb-3">Rate & Review</h4>
                <p className="text-gray-600">
                  Share your thoughts and ratings to help our AI understand your taste
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-900 text-white rounded flex items-center justify-center mx-auto mb-6 text-xl font-bold font-serif">
                  04
                </div>
                <h4 className="text-lg font-semibold font-serif mb-3">Get Recommendations</h4>
                <p className="text-gray-600">
                  Receive personalized AI-powered book suggestions tailored just for you
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-serif tracking-tight mb-6">Ready to Start Your Literary Journey?</h2>
            <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto">
              Join thousands of readers who have discovered their next favorite books with our AI-powered recommendations.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => openAuthModal('signup')}
                className="bg-white text-gray-900 px-8 py-4 rounded text-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-3"
              >
                <span>Start Reading Smarter</span>
                <Users className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>
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
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
        <div className="loading-brutalist">
          <div className="w-32 h-32 border-8 border-black bg-white flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-black" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b-8 border-black">
        <div className="container-brutalist">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center group">
              <div className="p-3 border-4 border-black bg-black text-white group-hover:bg-white group-hover:text-black transition-all duration-200">
                <BookOpen className="h-10 w-10" />
              </div>
              <div className="ml-4">
                <span className="text-3xl font-black font-serif tracking-tight">BOOKSHELF</span>
                <div className="text-xs font-mono uppercase tracking-ultra-wide text-gray-600">AI POWERED</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => openAuthModal('signin')}
                className="btn-primary flex items-center space-x-2"
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
        <section className="section-brutalist">
          <div className="container-brutalist">
            <div className="text-center max-w-5xl mx-auto">
              <h1 className="heading-xl mb-8 text-shadow-brutal">
                DISCOVER YOUR<br />
                <span className="relative">
                  NEXT FAVORITE
                  <div className="absolute -bottom-4 left-0 right-0 h-4 bg-black transform -skew-x-12"></div>
                </span><br />
                BOOK
              </h1>
              
              <div className="max-w-3xl mx-auto mb-12">
                <p className="text-body mb-6">
                  Get personalized book recommendations powered by artificial intelligence. 
                  Track your reading progress, rate books, and let our intelligent system 
                  suggest your next great literary adventure.
                </p>
                <div className="quote-brutalist">
                  "A reader lives a thousand lives before he dies... The man who never reads lives only one."
                  <div className="text-caption mt-2">— George R.R. Martin</div>
                </div>
              </div>
              
              <div className="flex justify-center mb-20">
                <button
                  onClick={() => openAuthModal('signup')}
                  className="btn-primary text-lg px-12 py-6 flex items-center justify-center space-x-3"
                >
                  <span>Get Started Free</span>
                  <Zap className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 border-y-8 border-black section-brutalist">
          <div className="container-brutalist">
            <div className="text-center mb-16">
              <h2 className="heading-lg mb-6">POWERFUL FEATURES</h2>
              <p className="text-body max-w-2xl mx-auto">
                Everything you need to discover, track, and enjoy your reading journey
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card group">
                <div className="flex items-center justify-center w-16 h-16 bg-black text-white mb-6 group-hover:bg-white group-hover:text-black group-hover:border-4 group-hover:border-black transition-all duration-200">
                  <Brain className="h-8 w-8" />
                </div>
                <h3 className="heading-sm mb-4">AI-POWERED RECOMMENDATIONS</h3>
                <p className="text-body text-gray-700">
                  Our advanced artificial intelligence analyzes your reading history, 
                  preferences, and ratings to suggest books you'll absolutely love.
                </p>
              </div>
              
              <div className="card group">
                <div className="flex items-center justify-center w-16 h-16 bg-black text-white mb-6 group-hover:bg-white group-hover:text-black group-hover:border-4 group-hover:border-black transition-all duration-200">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <h3 className="heading-sm mb-4">READING PROGRESS TRACKING</h3>
                <p className="text-body text-gray-700">
                  Set reading goals, monitor your progress with visual charts, 
                  and celebrate your literary achievements along the way.
                </p>
              </div>
              
              <div className="card group">
                <div className="flex items-center justify-center w-16 h-16 bg-black text-white mb-6 group-hover:bg-white group-hover:text-black group-hover:border-4 group-hover:border-black transition-all duration-200">
                  <Star className="h-8 w-8" />
                </div>
                <h3 className="heading-sm mb-4">RATE & REVIEW SYSTEM</h3>
                <p className="text-body text-gray-700">
                  Rate books, write detailed reviews, and help improve your 
                  personalized recommendations with every interaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="section-brutalist">
          <div className="container-brutalist">
            <div className="text-center mb-16">
              <h2 className="heading-lg mb-6">HOW IT WORKS</h2>
              <p className="text-body max-w-2xl mx-auto">
                Four simple steps to unlock your personalized reading experience
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-black text-white flex items-center justify-center mx-auto mb-6 text-2xl font-black font-serif group-hover:bg-white group-hover:text-black group-hover:border-4 group-hover:border-black transition-all duration-200 shadow-brutal-hover">
                  01
                </div>
                <h4 className="heading-sm mb-3">SIGN IN</h4>
                <p className="text-body text-gray-700">
                  Create your account securely with Google OAuth authentication
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-black text-white flex items-center justify-center mx-auto mb-6 text-2xl font-black font-serif group-hover:bg-white group-hover:text-black group-hover:border-4 group-hover:border-black transition-all duration-200 shadow-brutal-hover">
                  02
                </div>
                <h4 className="heading-sm mb-3">ADD BOOKS</h4>
                <p className="text-body text-gray-700">
                  Search our extensive database and add books you've read or want to read
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-black text-white flex items-center justify-center mx-auto mb-6 text-2xl font-black font-serif group-hover:bg-white group-hover:text-black group-hover:border-4 group-hover:border-black transition-all duration-200 shadow-brutal-hover">
                  03
                </div>
                <h4 className="heading-sm mb-3">RATE & REVIEW</h4>
                <p className="text-body text-gray-700">
                  Share your thoughts and ratings to help our AI understand your taste
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-black text-white flex items-center justify-center mx-auto mb-6 text-2xl font-black font-serif group-hover:bg-white group-hover:text-black group-hover:border-4 group-hover:border-black transition-all duration-200 shadow-brutal-hover">
                  04
                </div>
                <h4 className="heading-sm mb-3">GET RECOMMENDATIONS</h4>
                <p className="text-body text-gray-700">
                  Receive personalized AI-powered book suggestions tailored just for you
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-black text-white section-brutalist">
          <div className="container-brutalist text-center">
            <h2 className="heading-lg mb-6 text-white">READY TO START YOUR LITERARY JOURNEY?</h2>
            <p className="text-body mb-12 text-gray-300 max-w-2xl mx-auto">
              Join thousands of readers who have discovered their next favorite books with our AI-powered recommendations.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <button
                onClick={() => openAuthModal('signup')}
                className="bg-white text-black font-bold py-6 px-12 border-4 border-white hover:bg-black hover:text-white transition-all duration-200 transform hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none uppercase tracking-wider text-lg flex items-center justify-center space-x-3"
              >
                <span>Start Reading Smarter</span>
                <Users className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-8 border-black">
        <div className="container-brutalist py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 mr-3" />
              <span className="font-serif font-black text-2xl">BOOKSHELF AI</span>
            </div>
            <p className="text-caption text-gray-600 mb-4">
              Literature Meets Technology • Discover • Read • Repeat
            </p>
            <p className="font-mono text-xs text-gray-500">
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
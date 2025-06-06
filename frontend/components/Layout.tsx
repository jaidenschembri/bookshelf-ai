'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { BookOpen, Home, Search, Star, TrendingUp, LogOut, User, Menu, X } from 'lucide-react'
import { useState } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Books', href: '/books', icon: BookOpen },
    { name: 'Search Books', href: '/search', icon: Search },
    { name: 'Recommendations', href: '/recommendations', icon: Star },
  ]

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b-8 border-black">
        <div className="container-brutalist">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center group focus:outline-none">
                <div className="p-2 border-4 border-black bg-black text-white group-hover:bg-white group-hover:text-black transition-all duration-200">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div className="ml-4">
                  <span className="text-2xl font-black font-serif tracking-tight">BOOKSHELF</span>
                  <div className="text-xs font-mono uppercase tracking-ultra-wide text-gray-600">AI POWERED</div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-center space-x-1 px-3 py-3 border-2 border-black font-bold uppercase tracking-wide text-xs transition-all duration-200 focus:outline-none ${
                      isActive 
                        ? 'bg-black text-white' 
                        : 'bg-white text-black hover:bg-black hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="whitespace-nowrap">{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* User Menu & Mobile Toggle */}
            <div className="flex items-center space-x-3">
              {session?.user && (
                <div className="hidden md:flex items-center space-x-3">
                  <span className="font-mono text-sm uppercase tracking-wide text-gray-700">
                    {session.user.name?.split(' ')[0]}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 px-3 py-2 border-2 border-black bg-white text-black hover:bg-black hover:text-white font-bold uppercase tracking-wider text-xs transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 border-4 border-black bg-white hover:bg-black hover:text-white transition-all duration-200"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t-4 border-black bg-white">
            <div className="container-brutalist py-4">
              <div className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 w-full px-4 py-3 border-2 border-black font-bold uppercase tracking-wider text-sm transition-all duration-200 ${
                        isActive 
                          ? 'bg-black text-white' 
                          : 'bg-white text-black hover:bg-black hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
                
                {session?.user && (
                  <>
                    <div className="border-t-2 border-black pt-4 mt-4">
                      <div className="flex items-center space-x-2 px-4 py-2 mb-2">
                        <User className="h-4 w-4" />
                        <span className="font-mono text-sm uppercase tracking-wide">{session.user.name}</span>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 w-full px-4 py-2 border-2 border-black bg-white text-black hover:bg-black hover:text-white font-bold uppercase tracking-wider text-xs transition-all duration-200"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="container-brutalist section-brutalist">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white border-t-8 border-black">
        <div className="container-brutalist py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <BookOpen className="h-6 w-6 mr-2" />
                <span className="font-serif font-bold text-xl">BOOKSHELF AI</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Discover your next favorite book with AI-powered personalized recommendations.
              </p>
            </div>
            
            <div>
              <h3 className="font-serif font-bold text-lg mb-4">FEATURES</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• AI Recommendations</li>
                <li>• Reading Progress</li>
                <li>• Book Management</li>
                <li>• Personal Library</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-serif font-bold text-lg mb-4">TECHNOLOGY</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Next.js Frontend</li>
                <li>• FastAPI Backend</li>
                <li>• DeepSeek AI</li>
                <li>• Open Library API</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400 font-mono text-xs uppercase tracking-wider">
              © 2024 Bookshelf AI • Literature Meets Technology
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 
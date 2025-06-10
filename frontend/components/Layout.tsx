'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { BookOpen, Home, Search, Star, TrendingUp, LogOut, User, Menu, X, Users } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Books', href: '/books', icon: BookOpen },
    { name: 'Search Books', href: '/search', icon: Search },
    { name: 'Recommendations', href: '/recommendations', icon: Star },
    { name: 'Social', href: '/social', icon: Users },
  ]

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center group focus:outline-none">
                <div className="p-3 border-4 border-black bg-black text-white group-hover:bg-white group-hover:text-black transition-all duration-200">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="ml-3">
                  <span className="text-xl font-black font-serif tracking-tight">BOOKSHELF</span>
                  <div className="text-xs font-mono uppercase tracking-ultra-wide text-gray-600">AI POWERED</div>
                </div>
              </Link>
            </div>

            {/* Right side - Navigation and Sign Out */}
            <div className="hidden lg:flex items-center space-x-8">
              {/* Navigation Links */}
              <div className="flex items-center space-x-6">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                                         <Link
                       key={item.name}
                       href={item.href}
                       className={`text-sm font-medium transition-colors duration-200 focus:outline-none ${
                         isActive 
                           ? 'text-black' 
                           : 'text-gray-600 hover:text-black'
                       }`}
                     >
                      {item.name}
                    </Link>
                  )
                })}
              </div>

                             {/* Profile Dropdown */}
               {session?.user && (
                 <div className="relative" ref={dropdownRef}>
                   <button
                     onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                     className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-200 focus:outline-none"
                   >
                     {session.user.image ? (
                       <Image
                         src={session.user.image}
                         alt={session.user.name || 'Profile'}
                         width={32}
                         height={32}
                         className="w-8 h-8 rounded-full object-cover"
                       />
                     ) : (
                       <User className="h-4 w-4 text-gray-600" />
                     )}
                   </button>

                   {/* Dropdown Menu */}
                   {profileDropdownOpen && (
                     <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                       <div className="py-1">
                         <button
                           onClick={() => {
                             setProfileDropdownOpen(false)
                             router.push(`/user/${session.user.id}`)
                           }}
                           className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                         >
                           <User className="h-4 w-4 mr-3" />
                           Profile
                         </button>
                         <button
                           onClick={() => {
                             setProfileDropdownOpen(false)
                             handleSignOut()
                           }}
                           className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                         >
                           <LogOut className="h-4 w-4 mr-3" />
                           Sign out
                         </button>
                       </div>
                     </div>
                   )}
                 </div>
               )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-black transition-colors duration-200"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 w-full px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                        isActive 
                          ? 'text-black bg-gray-50' 
                          : 'text-gray-600 hover:text-black hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
                
                {session?.user && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center space-x-2 px-4 py-2 mb-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">{session.user.name}</span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="h-5 w-5 mr-2 text-gray-600" />
              <span className="font-serif font-semibold text-lg text-gray-900">Bookshelf AI</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Discover your next favorite book with AI-powered personalized recommendations.
            </p>
            <p className="text-xs text-gray-400">
              © 2024 Bookshelf AI • Literature Meets Technology
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 
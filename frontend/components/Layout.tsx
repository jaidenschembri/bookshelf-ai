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
        <div className="container-brutalist">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center focus:outline-none">
                <div className="p-2 bg-black text-white rounded">
                  <BookOpen className="h-6 w-6" />
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
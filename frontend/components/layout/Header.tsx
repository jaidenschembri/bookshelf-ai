import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X, BookOpen } from 'lucide-react'
import Logo from './Logo'
import NavigationLinks, { NavigationItem } from './NavigationLinks'
import ProfileDropdown, { ProfileUser } from './ProfileDropdown'
import MobileMenu from './MobileMenu'
import GlobalSearch from './GlobalSearch'
import { MobileSearchBar } from '@/components/mobile'

export interface HeaderProps {
  navigationItems: NavigationItem[]
  user?: ProfileUser | null
  onSignOut: () => void
  className?: string
}

const Header: React.FC<HeaderProps> = ({
  navigationItems,
  user,
  onSignOut,
  className = ''
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      <nav className={`bg-white/95 border-b border-slate-200/60 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-white/75 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Logo />
            </div>

            {/* Desktop Navigation - Center Search Bar */}
            <div className="flex items-center flex-1 max-w-2xl mx-8">
              <GlobalSearch />
            </div>

            {/* Desktop Navigation - Right Side */}
            <div className="flex items-center space-x-6">
              {/* Navigation Links */}
              <NavigationLinks items={navigationItems} />

              {/* Profile Dropdown */}
              {user && (
                <ProfileDropdown
                  user={user}
                  onSignOut={onSignOut}
                />
              )}
            </div>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden">
            {/* Mobile Header: Logo Icon + Search + Menu Button */}
            <div className="flex items-center justify-between h-12 gap-3">
              {/* Logo Icon Only */}
              <div className="flex items-center flex-shrink-0">
                <Link href="/dashboard" className="flex items-center group focus:outline-none">
                  <div className="p-2 border-4 border-black bg-black text-white group-hover:bg-white group-hover:text-black transition-all duration-200">
                    <BookOpen className="h-4 w-4" />
                  </div>
                </Link>
              </div>

              {/* Search Bar - Takes up remaining space */}
              <div className="flex-1 py-2">
                <MobileSearchBar />
              </div>

              {/* Menu Button */}
              <button
                onClick={handleMobileMenuToggle}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100/80 rounded-lg transition-all duration-200 flex-shrink-0 hover:scale-105"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        navigationItems={navigationItems}
        user={user}
        onClose={handleMobileMenuClose}
        onSignOut={onSignOut}
      />
    </>
  )
}

export default Header 
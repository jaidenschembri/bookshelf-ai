import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'
import NavigationLinks, { NavigationItem } from './NavigationLinks'
import ProfileDropdown, { ProfileUser } from './ProfileDropdown'
import MobileMenu from './MobileMenu'
import GlobalSearch from './GlobalSearch'

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
      <nav className={`bg-white border-b border-gray-200 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Logo />
            </div>

            {/* Desktop Navigation - Center Search Bar */}
            <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-8">
              <GlobalSearch />
            </div>

            {/* Desktop Navigation - Right Side */}
            <div className="hidden lg:flex items-center space-x-6">
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

            {/* Mobile menu button */}
            <button
              onClick={handleMobileMenuToggle}
              className="lg:hidden p-2 text-gray-600 hover:text-black transition-colors duration-200"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
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
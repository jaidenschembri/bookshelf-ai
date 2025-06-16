import React from 'react'
import Link from 'next/link'
import { User, LogOut } from 'lucide-react'
import Image from 'next/image'
import NavigationLinks, { NavigationItem } from './NavigationLinks'
import GlobalSearch from './GlobalSearch'

export interface MobileMenuUser {
  id: string | number
  name?: string | null
  image?: string | null
}

export interface MobileMenuProps {
  isOpen: boolean
  navigationItems: NavigationItem[]
  user?: MobileMenuUser | null
  onClose: () => void
  onSignOut: () => void
  className?: string
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  navigationItems,
  user,
  onClose,
  onSignOut,
  className = ''
}) => {
  if (!isOpen) return null

  return (
    <div className={`lg:hidden border-t border-gray-200 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="space-y-4">
          {/* Mobile Search */}
          <div className="pb-2">
            <GlobalSearch className="max-w-none" />
          </div>
          
          {/* Navigation Links */}
          <NavigationLinks
            items={navigationItems}
            orientation="vertical"
            showIcons={true}
            onItemClick={onClose}
          />
          
          {/* User Profile Section */}
          {user && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              {/* User Info */}
              <div className="flex items-center space-x-2 px-4 py-2 mb-2">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || 'Profile'}
                    width={16}
                    height={16}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              
              {/* Profile Link */}
              <Link
                href={`/user/${user.id}`}
                onClick={onClose}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 transition-colors duration-200"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              
              {/* Sign Out Button */}
              <button
                onClick={() => {
                  onClose()
                  onSignOut()
                }}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MobileMenu 
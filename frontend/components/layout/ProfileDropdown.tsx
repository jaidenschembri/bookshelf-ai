import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, LogOut } from 'lucide-react'
import Image from 'next/image'

export interface ProfileUser {
  id: string | number
  name?: string | null
  image?: string | null
}

export interface ProfileDropdownProps {
  user: ProfileUser
  onSignOut: () => void
  className?: string
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  onSignOut,
  className = ''
}) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleProfileClick = () => {
    setIsOpen(false)
    router.push(`/user/${user.id}`)
  }

  const handleSignOutClick = () => {
    setIsOpen(false)
    onSignOut()
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-200 focus:outline-none"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || 'Profile'}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <User className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={handleProfileClick}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <User className="h-4 w-4 mr-3" />
              Profile
            </button>
            <button
              onClick={handleSignOutClick}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileDropdown 
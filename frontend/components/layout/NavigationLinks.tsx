import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
}

export interface NavigationLinksProps {
  items: NavigationItem[]
  className?: string
  orientation?: 'horizontal' | 'vertical'
  showIcons?: boolean
  onItemClick?: () => void
}

const NavigationLinks: React.FC<NavigationLinksProps> = ({
  items,
  className = '',
  orientation = 'horizontal',
  showIcons = false,
  onItemClick
}) => {
  const pathname = usePathname()

  const containerClasses = orientation === 'horizontal' 
    ? 'flex items-center space-x-6'
    : 'space-y-2'

  const linkClasses = (isActive: boolean) => {
    const baseClasses = 'text-sm font-medium transition-colors duration-200 focus:outline-none'
    const activeClasses = isActive ? 'text-black' : 'text-gray-600 hover:text-black'
    
    if (orientation === 'vertical' && showIcons) {
      const verticalClasses = isActive 
        ? 'text-black bg-gray-50' 
        : 'text-gray-600 hover:text-black hover:bg-gray-50'
      return `flex items-center space-x-3 w-full px-4 py-3 ${baseClasses} ${verticalClasses}`
    }
    
    return `${baseClasses} ${activeClasses}`
  }

  return (
    <div className={`${containerClasses} ${className}`}>
      {items.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={linkClasses(isActive)}
          >
            {showIcons && <Icon className="h-5 w-5" />}
            <span>{item.name}</span>
          </Link>
        )
      })}
    </div>
  )
}

export default NavigationLinks 
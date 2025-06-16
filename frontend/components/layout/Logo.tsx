import React from 'react'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export interface LogoProps {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Logo: React.FC<LogoProps> = ({
  href = '/dashboard',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: {
      icon: 'h-4 w-4',
      iconPadding: 'p-2',
      title: 'text-base',
      subtitle: 'text-xs'
    },
    md: {
      icon: 'h-6 w-6',
      iconPadding: 'p-3',
      title: 'text-xl',
      subtitle: 'text-xs'
    },
    lg: {
      icon: 'h-8 w-8',
      iconPadding: 'p-4',
      title: 'text-2xl',
      subtitle: 'text-sm'
    }
  }

  const sizes = sizeClasses[size]

  return (
    <Link href={href} className={`flex items-center group focus:outline-none ${className}`}>
      <div className={`${sizes.iconPadding} border-4 border-black bg-black text-white group-hover:bg-white group-hover:text-black transition-all duration-200`}>
        <BookOpen className={sizes.icon} />
      </div>
      <div className="ml-3">
        <span className={`${sizes.title} font-black font-serif tracking-tight`}>BOOKSHELF</span>
        <div className={`${sizes.subtitle} font-mono uppercase tracking-ultra-wide text-gray-600`}>AI POWERED</div>
      </div>
    </Link>
  )
}

export default Logo 
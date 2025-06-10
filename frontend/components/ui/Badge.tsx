import React from 'react'
import { BadgeVariant, BaseComponentProps } from '@/types/ui'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

export interface BadgeProps extends BaseComponentProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md' | 'lg'
  color?: 'black' | 'red' | 'green' | 'blue' | 'yellow' | 'gray'
  icon?: React.ReactNode
  count?: number
  rating?: number
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'status',
  size = 'md',
  color = 'black',
  className,
  icon,
  count,
  rating,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-bold uppercase tracking-wider border-2'
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-2 text-sm'
  }
  
  const colorClasses = {
    black: 'bg-black text-white border-black',
    red: 'bg-red-600 text-white border-red-600',
    green: 'bg-green-600 text-white border-green-600',
    blue: 'bg-blue-600 text-white border-blue-600',
    yellow: 'bg-yellow-400 text-black border-yellow-400',
    gray: 'bg-gray-200 text-black border-gray-400'
  }
  
  const badgeClasses = cn(
    baseClasses,
    sizeClasses[size],
    colorClasses[color],
    className
  )
  
  const renderContent = () => {
    if (variant === 'rating' && rating !== undefined) {
      return (
        <div className="flex items-center space-x-1">
          <Star className="w-3 h-3 fill-current" />
          <span>{rating}</span>
        </div>
      )
    }
    
    if (variant === 'count' && count !== undefined) {
      return <span>{count}</span>
    }
    
    if (icon) {
      return (
        <div className="flex items-center space-x-1">
          {icon}
          <span>{children}</span>
        </div>
      )
    }
    
    return <span>{children}</span>
  }
  
  return (
    <span className={badgeClasses} {...props}>
      {renderContent()}
    </span>
  )
}

export default Badge 
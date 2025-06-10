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
  color = 'gray',
  className,
  icon,
  count,
  rating,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium text-xs rounded-full px-2 py-1'
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1'
  }
  
  const colorClasses = {
    black: 'bg-gray-900 text-white',
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-700'
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
          <Star className="w-3 h-3 fill-current text-yellow-400" />
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
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
  const baseClasses = 'inline-flex items-center font-medium text-xs rounded-full px-2 py-1 transition-all duration-200 ring-1 ring-inset'
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1'
  }
  
  const colorClasses = {
    black: 'bg-slate-900 text-white ring-slate-700/50',
    red: 'bg-red-50 text-red-700 ring-red-200/60 hover:bg-red-100',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 hover:bg-emerald-100',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200/60 hover:bg-blue-100',
    yellow: 'bg-amber-50 text-amber-700 ring-amber-200/60 hover:bg-amber-100',
    gray: 'bg-slate-100 text-slate-700 ring-slate-200/60 hover:bg-slate-200'
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
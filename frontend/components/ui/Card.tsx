import React from 'react'
import { CardVariant, BaseComponentProps } from '@/types/ui'
import { cn } from '@/lib/utils'

export interface CardProps extends BaseComponentProps {
  variant?: CardVariant
  header?: React.ReactNode
  footer?: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  clickable?: boolean
  onClick?: () => void
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className,
  header,
  footer,
  padding = 'md',
  clickable = false,
  onClick,
  ...props
}) => {
  const baseClasses = 'bg-white border border-gray-200 rounded transition-colors'
  
  const variantClasses = {
    default: '',
    flat: 'border-gray-200',
    hover: 'hover:border-gray-300 hover:shadow-sm',
    compact: 'border-gray-200',
    featured: 'border-gray-300 shadow-sm'
  }
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  const clickableClasses = clickable ? 'cursor-pointer hover:bg-gray-50' : ''
  
  const cardClasses = cn(
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    clickableClasses,
    className
  )
  
  const CardWrapper = clickable ? 'button' : 'div'
  
  return (
    <CardWrapper
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {header && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          {header}
        </div>
      )}
      
      <div className={header || footer ? '' : ''}>
        {children}
      </div>
      
      {footer && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {footer}
        </div>
      )}
    </CardWrapper>
  )
}

export default Card
export { Card } 
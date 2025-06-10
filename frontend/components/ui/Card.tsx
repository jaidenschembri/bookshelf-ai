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
  const baseClasses = 'bg-white border-black transition-all duration-200'
  
  const variantClasses = {
    default: 'border-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
    flat: 'border-2',
    hover: 'border-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]',
    compact: 'border-2',
    featured: 'border-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
  }
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  const clickableClasses = clickable ? 'cursor-pointer' : ''
  
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
        <div className="mb-6 pb-4 border-b-2 border-black">
          {header}
        </div>
      )}
      
      <div className={header || footer ? '' : ''}>
        {children}
      </div>
      
      {footer && (
        <div className="mt-6 pt-4 border-t-2 border-black">
          {footer}
        </div>
      )}
    </CardWrapper>
  )
}

export default Card
export { Card } 
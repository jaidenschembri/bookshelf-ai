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
  const baseClasses = 'bg-white border border-slate-200/60 rounded-xl transition-all duration-300 backdrop-blur-sm'
  
  const variantClasses = {
    default: 'shadow-sm hover:shadow-md hover:-translate-y-0.5',
    flat: 'border-slate-200/40 shadow-none hover:shadow-sm',
    hover: 'hover:border-slate-300/80 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]',
    compact: 'border-slate-200/60 shadow-sm hover:shadow-md',
    featured: 'border-slate-300/80 shadow-lg ring-1 ring-slate-200/50 hover:shadow-xl hover:-translate-y-1'
  }
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  const clickableClasses = clickable ? 'cursor-pointer hover:bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300/50' : ''
  
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
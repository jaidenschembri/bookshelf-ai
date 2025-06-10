import React from 'react'
import { BaseComponentProps } from '@/types/ui'
import { cn } from '@/lib/utils'

export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'pulse' | 'bounce'
  text?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }
  
  const spinnerClasses = cn(
    'border-4 border-black border-t-transparent rounded-full animate-spin',
    sizeClasses[size],
    className
  )
  
  const pulseClasses = cn(
    'bg-black rounded-full loading-brutalist',
    sizeClasses[size],
    className
  )
  
  const bounceClasses = cn(
    'bg-black rounded-full animate-bounce',
    sizeClasses[size],
    className
  )
  
  const renderSpinner = () => {
    switch (variant) {
      case 'pulse':
        return <div className={pulseClasses} {...props} />
      case 'bounce':
        return <div className={bounceClasses} {...props} />
      default:
        return <div className={spinnerClasses} {...props} />
    }
  }
  
  if (text) {
    return (
      <div className="flex flex-col items-center space-y-4">
        {renderSpinner()}
        <p className="text-caption text-black">{text}</p>
      </div>
    )
  }
  
  return renderSpinner()
}

export default LoadingSpinner 
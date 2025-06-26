import React from 'react'
import { ButtonVariant, ButtonSize, BaseComponentProps, ComponentStates } from '@/types/ui'
import { cn } from '@/lib/utils'

export interface ButtonProps extends BaseComponentProps, ComponentStates {
  variant?: ButtonVariant
  size?: ButtonSize
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  type = 'button',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  ...props
}) => {
  const baseClasses = 'font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rounded-md'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg',
    secondary: 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 shadow-md',
    ghost: 'bg-transparent text-gray-600 hover:bg-blue-50 hover:text-blue-600',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  
  const widthClasses = fullWidth ? 'w-full' : ''
  
  const buttonClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClasses,
    className
  )
  
  const renderContent = () => {
    if (loading) {
      return (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      )
    }
    
    if (icon && iconPosition === 'left') {
      return (
        <>
          {icon}
          <span>{children}</span>
        </>
      )
    }
    
    if (icon && iconPosition === 'right') {
      return (
        <>
          <span>{children}</span>
          {icon}
        </>
      )
    }
    
    return <span>{children}</span>
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {renderContent()}
    </button>
  )
}

export default Button
export { Button } 
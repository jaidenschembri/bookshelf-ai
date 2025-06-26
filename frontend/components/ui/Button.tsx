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
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
    secondary: 'bg-white text-slate-600 border border-slate-300/60 hover:bg-slate-50 hover:border-slate-400/80 shadow-md hover:shadow-lg',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-800',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
    success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
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
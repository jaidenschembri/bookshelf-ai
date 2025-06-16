import React from 'react'
import { InputVariant, BaseComponentProps, ComponentStates } from '@/types/ui'
import { cn } from '@/lib/utils'

export interface InputProps extends BaseComponentProps, ComponentStates {
  variant?: InputVariant
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url'
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  label?: string
  helperText?: string
  errorMessage?: string
  required?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const Input: React.FC<InputProps> = ({
  variant = 'default',
  type = 'text',
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  className,
  label,
  helperText,
  errorMessage,
  loading = false,
  disabled = false,
  error = false,
  success = false,
  required = false,
  icon,
  iconPosition = 'left',
  ...props
}) => {
  const baseClasses = 'w-full bg-white text-gray-900 text-sm placeholder:text-gray-500 transition-colors focus:outline-none rounded'
  
  const variantClasses = {
    default: 'px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-transparent',
    large: 'px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-transparent text-base',
    error: 'px-3 py-2 border border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-transparent',
    success: 'px-3 py-2 border border-green-300 bg-green-50 focus:ring-2 focus:ring-green-500 focus:border-transparent'
  }
  
  const stateClasses = error || errorMessage ? variantClasses.error : 
                      success ? variantClasses.success : 
                      variantClasses[variant]
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''
  
  const inputClasses = cn(
    baseClasses,
    stateClasses,
    disabledClasses,
    icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '',
    className
  )
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled || loading}
          required={required}
          className={inputClasses}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      
      {(helperText || errorMessage) && (
        <p className={cn(
          'text-xs mt-2',
          errorMessage ? 'text-red-600' : 'text-gray-600'
        )}>
          {errorMessage || helperText}
        </p>
      )}
    </div>
  )
}

export default Input 
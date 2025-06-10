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
  const baseClasses = 'w-full bg-white text-black font-mono text-sm placeholder:text-gray-500 transition-all duration-200 focus:outline-none'
  
  const variantClasses = {
    default: 'px-4 py-3 border-4 border-black focus:bg-gray-100',
    large: 'px-6 py-4 border-4 border-black focus:bg-gray-100 text-base',
    error: 'px-4 py-3 border-4 border-red-600 bg-red-50 focus:bg-red-100',
    success: 'px-4 py-3 border-4 border-green-600 bg-green-50 focus:bg-green-100'
  }
  
  const stateClasses = error || errorMessage ? variantClasses.error : 
                      success ? variantClasses.success : 
                      variantClasses[variant]
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''
  
  const inputClasses = cn(
    baseClasses,
    stateClasses,
    disabledClasses,
    icon ? (iconPosition === 'left' ? 'pl-12' : 'pr-12') : '',
    className
  )
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-caption text-black mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600">
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
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600">
            {icon}
          </div>
        )}
        
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="loading-brutalist w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      
      {(helperText || errorMessage) && (
        <p className={cn(
          'text-xs font-mono uppercase tracking-wider mt-2',
          errorMessage ? 'text-red-600' : 'text-gray-600'
        )}>
          {errorMessage || helperText}
        </p>
      )}
    </div>
  )
}

export default Input 
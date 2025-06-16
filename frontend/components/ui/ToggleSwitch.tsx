import React from 'react'
import { cn } from '@/lib/utils'

export interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: {
      switch: 'h-5 w-9',
      thumb: 'h-3 w-3',
      translateChecked: 'translate-x-5',
      translateUnchecked: 'translate-x-1'
    },
    md: {
      switch: 'h-6 w-11',
      thumb: 'h-4 w-4',
      translateChecked: 'translate-x-6',
      translateUnchecked: 'translate-x-1'
    },
    lg: {
      switch: 'h-7 w-13',
      thumb: 'h-5 w-5',
      translateChecked: 'translate-x-7',
      translateUnchecked: 'translate-x-1'
    }
  }

  const sizes = sizeClasses[size]

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  if (label || description) {
    return (
      <div className={cn('flex items-center justify-between', className)}>
        <div className="flex-1">
          {label && (
            <div className="font-medium text-gray-900 mb-1">{label}</div>
          )}
          {description && (
            <div className="text-sm text-gray-600">{description}</div>
          )}
        </div>
        
        <button
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            'relative inline-flex items-center rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
            sizes.switch,
            checked 
              ? 'bg-gray-900 border-gray-900' 
              : 'bg-gray-200 border-gray-300',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span
            className={cn(
              'inline-block transform rounded-full bg-white transition-transform',
              sizes.thumb,
              checked ? sizes.translateChecked : sizes.translateUnchecked
            )}
          />
        </button>
      </div>
    )
  }

  // Standalone toggle
  return (
    <button
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
        sizes.switch,
        checked 
          ? 'bg-gray-900 border-gray-900' 
          : 'bg-gray-200 border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'inline-block transform rounded-full bg-white transition-transform',
          sizes.thumb,
          checked ? sizes.translateChecked : sizes.translateUnchecked
        )}
      />
    </button>
  )
}

export default ToggleSwitch 
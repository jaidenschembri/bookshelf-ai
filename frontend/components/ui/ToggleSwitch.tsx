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
      container: 'w-8 h-4',
      circle: 'w-3 h-3',
      translate: 'translate-x-4'
    },
    md: {
      container: 'w-11 h-6',
      circle: 'w-5 h-5',
      translate: 'translate-x-5'
    },
    lg: {
      container: 'w-13 h-7',
      circle: 'w-6 h-6',
      translate: 'translate-x-6'
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
            sizes.container,
            checked ? 'bg-gray-600 border-gray-600' : 'bg-gray-200 border-gray-300',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span
            className={cn(
              'inline-block transform rounded-full bg-white transition-transform',
              sizes.circle,
              checked ? sizes.translate : 'translate-x-0'
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
        sizes.container,
        checked ? 'bg-gray-600 border-gray-600' : 'bg-gray-200 border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'inline-block transform rounded-full bg-white transition-transform',
          sizes.circle,
          checked ? sizes.translate : 'translate-x-0'
        )}
      />
    </button>
  )
}

export default ToggleSwitch 
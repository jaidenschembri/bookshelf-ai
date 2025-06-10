import React from 'react'
import { cn } from '@/lib/utils'

export interface TabOption {
  value: string
  label: string
  count?: number
}

export interface TabNavigationProps {
  options: TabOption[]
  activeTab: string
  onTabChange: (value: string) => void
  className?: string
  spacing?: 'normal' | 'wide'
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  options,
  activeTab,
  onTabChange,
  className,
  spacing = 'normal'
}) => {
  const spacingClasses = {
    normal: 'space-x-6',
    wide: 'space-x-8'
  }

  return (
    <div className={cn("flex items-center", spacingClasses[spacing], className)}>
      {options.map((option) => {
        const isActive = activeTab === option.value
        
        return (
          <button
            key={option.value}
            onClick={() => onTabChange(option.value)}
            className={cn(
              'text-sm transition-colors duration-200 focus:outline-none focus:ring-0 active:bg-transparent',
              isActive 
                ? 'text-gray-900 font-semibold' 
                : 'text-gray-600 hover:text-gray-900 font-medium'
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="ml-2 text-xs text-gray-500">
                ({option.count})
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default TabNavigation
export { TabNavigation } 
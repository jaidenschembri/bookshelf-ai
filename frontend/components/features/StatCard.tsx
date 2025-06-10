import React from 'react'
import { Card } from '@/components/ui'
import { LucideIcon } from 'lucide-react'

export interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtitle?: string
  variant?: 'default' | 'flat'
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  subtitle,
  variant = 'flat'
}) => {
  return (
    <Card variant={variant} padding="sm" className="border border-gray-200 shadow-none">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center rounded">
          <Icon className="h-5 w-5" />
        </div>
        <div className="ml-4">
          <p className="text-xs font-mono uppercase tracking-wide text-gray-500 mb-1">{label}</p>
          <p className="text-xl font-semibold font-serif">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  )
}

export default StatCard
export { StatCard } 
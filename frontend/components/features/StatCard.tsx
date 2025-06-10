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
    <Card variant={variant} padding="md">
      <div className="flex items-center">
        <div className="w-16 h-16 bg-black text-white flex items-center justify-center">
          <Icon className="h-8 w-8" />
        </div>
        <div className="ml-6">
          <p className="text-caption text-gray-600 mb-1">{label}</p>
          <p className="text-4xl font-black font-serif">{value}</p>
          {subtitle && (
            <p className="text-caption text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  )
}

export default StatCard
export { StatCard } 
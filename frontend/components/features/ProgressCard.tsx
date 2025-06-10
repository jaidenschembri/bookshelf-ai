import React from 'react'
import { Card } from '@/components/ui'

export interface ProgressCardProps {
  title: string
  progress: number
  description: string
  variant?: 'default' | 'flat'
  className?: string
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  progress,
  description,
  variant = 'default',
  className
}) => {
  return (
    <Card variant={variant} padding="lg" className={className}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="heading-sm">{title}</h3>
        <span className="text-caption">{progress.toFixed(1)}% COMPLETE</span>
      </div>
      <div className="progress-bar mb-4">
        <div 
          className="progress-fill" 
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="text-body text-gray-600">{description}</p>
    </Card>
  )
}

export default ProgressCard
export { ProgressCard } 
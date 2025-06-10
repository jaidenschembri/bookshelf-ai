import React from 'react'

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
    <div className={`border border-gray-200 p-4 rounded ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold font-serif">{title}</h3>
        <span className="text-xs font-mono uppercase tracking-wide text-gray-500">{progress.toFixed(1)}% complete</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
        <div 
          className="bg-gray-800 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

export default ProgressCard
export { ProgressCard } 
import React from 'react'
import { BookOpen, Target, Clock, CheckCircle } from 'lucide-react'
import { StatCard, ProgressCard } from '@/components/ui'
import { ComponentErrorBoundary } from '@/components/ErrorBoundary'

export interface DashboardStatsData {
  total_books: number
  goal_progress: number
  books_this_year: number
  reading_goal: number
  currently_reading: number
  want_to_read: number
}

export interface DashboardStatsProps {
  stats: DashboardStatsData
  showProgress?: boolean
  className?: string
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  showProgress = true,
  className = ''
}) => {
  return (
    <div className={className}>
      {/* Stats Grid - Wrapped in error boundary */}
      <ComponentErrorBoundary componentName="Stats Grid">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={BookOpen}
            label="Books Read"
            value={stats.total_books}
          />
          
          <StatCard
            icon={Target}
            label="Reading Goal"
            value={`${stats.goal_progress}%`}
            subtitle={`${stats.books_this_year} of ${stats.reading_goal} books`}
          />
          
          <StatCard
            icon={Clock}
            label="Currently Reading"
            value={stats.currently_reading}
          />
          
          <StatCard
            icon={CheckCircle}
            label="Want to Read"
            value={stats.want_to_read}
          />
        </div>
      </ComponentErrorBoundary>

      {/* Reading Progress */}
      {showProgress && stats.reading_goal > 0 && (
        <ComponentErrorBoundary componentName="Reading Progress">
          <div className="mb-8">
            <ProgressCard
              title="Reading Goal Progress"
              progress={stats.goal_progress}
              description={`${stats.books_this_year} of ${stats.reading_goal} books read this year`}
            />
          </div>
        </ComponentErrorBoundary>
      )}
    </div>
  )
}

export default DashboardStats 
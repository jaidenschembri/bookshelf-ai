import React from 'react'
import Link from 'next/link'
import { BookCard } from '@/components/features'
import { ComponentErrorBoundary } from '@/components/ErrorBoundary'
import { Reading } from '@/lib/api'

export interface DashboardRecentActivityProps {
  recentReadings: Reading[]
  onBookClick: (book: any, bookId?: number) => void
  maxItems?: number
  className?: string
}

const DashboardRecentActivity: React.FC<DashboardRecentActivityProps> = ({
  recentReadings,
  onBookClick,
  maxItems = 6,
  className = ''
}) => {
  if (!recentReadings || recentReadings.length === 0) {
    return null
  }

  return (
    <ComponentErrorBoundary componentName="Recent Activity">
      <div className={`mb-8 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-serif tracking-tight">Recent Activity</h2>
          <Link 
            href="/books" 
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentReadings.slice(0, maxItems).map((reading) => (
            <BookCard
              key={reading.id}
              book={reading.book}
              reading={reading}
              onClick={() => onBookClick(reading.book, reading.book.id)}
              mode="compact"
              showRating={true}
            />
          ))}
        </div>
      </div>
    </ComponentErrorBoundary>
  )
}

export default DashboardRecentActivity 
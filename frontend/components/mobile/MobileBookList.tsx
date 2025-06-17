import React, { useState } from 'react'
import { Reading } from '@/lib/api'
import MobileBookListItem from './MobileBookListItem'
import MobileBookMenu from './MobileBookMenu'

export interface MobileBookListProps {
  readings: Reading[]
  onBookClick: (book: any, bookId?: number) => void
  onStatusChange: (reading: Reading, status: string) => void
  onRatingChange: (reading: Reading, rating: number) => void
  onEdit: (reading: Reading) => void
  onDelete: (reading: Reading) => void
  loading?: boolean
  emptyMessage?: string
  className?: string
}

const MobileBookList: React.FC<MobileBookListProps> = ({
  readings,
  onBookClick,
  onStatusChange,
  onRatingChange,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = "No books found",
  className = ''
}) => {
  const [activeMenuReading, setActiveMenuReading] = useState<Reading | null>(null)

  // Find the current reading data (in case it was updated)
  const getCurrentReading = (readingId: number): Reading | null => {
    return readings.find(r => r.id === readingId) || null
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        {/* Loading skeleton */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center py-3 px-4 border-b border-gray-100 last:border-b-0">
            <div className="flex-shrink-0 mr-3">
              <div className="w-10 h-15 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
            <div className="flex-shrink-0 ml-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (readings.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center ${className}`}>
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      <div className={`bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 ${className}`}>
        {readings.map((reading, index) => (
          <MobileBookListItem
            key={reading.id}
            reading={reading}
            onBookClick={onBookClick}
            onMenuClick={(reading) => setActiveMenuReading(reading)}
            priority={index < 6} // Priority loading for first 6 books
          />
        ))}
      </div>

      {/* Mobile Menu */}
      {activeMenuReading && (() => {
        const currentReading = getCurrentReading(activeMenuReading.id)
        if (!currentReading) return null
        
        return (
          <MobileBookMenu
            reading={currentReading}
            isOpen={!!activeMenuReading}
            onClose={() => setActiveMenuReading(null)}
            onStatusChange={(status) => {
              onStatusChange(currentReading, status)
            }}
            onRatingChange={(rating) => {
              onRatingChange(currentReading, rating)
            }}
            onEdit={() => {
              onEdit(currentReading)
              setActiveMenuReading(null)
            }}
            onDelete={() => {
              onDelete(currentReading)
              setActiveMenuReading(null)
            }}
          />
        )
      })()}
    </>
  )
}

export default MobileBookList 
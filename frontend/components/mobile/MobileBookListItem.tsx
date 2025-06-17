import React from 'react'
import { MoreVertical } from 'lucide-react'
import { BookCover, Badge } from '@/components/ui'
import { Reading } from '@/lib/api'

export interface MobileBookListItemProps {
  reading: Reading
  onBookClick: (book: any, bookId?: number) => void
  onMenuClick?: (reading: Reading) => void
  priority?: boolean
  className?: string
}

const MobileBookListItem: React.FC<MobileBookListItemProps> = ({
  reading,
  onBookClick,
  onMenuClick,
  priority = false,
  className = ''
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished': return 'green'
      case 'currently_reading': return 'blue'
      case 'want_to_read': return 'gray'
      default: return 'gray'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'finished': return 'Finished'
      case 'currently_reading': return 'Reading'
      case 'want_to_read': return 'Want to Read'
      default: return status
    }
  }

  const getProgressText = () => {
    if (reading.status === 'currently_reading' && reading.progress_pages && reading.total_pages) {
      const percentage = Math.round((reading.progress_pages / reading.total_pages) * 100)
      return `${reading.progress_pages}/${reading.total_pages} pages (${percentage}%)`
    }
    if (reading.status === 'finished' && reading.rating) {
      return `Rated ${reading.rating}/5 stars`
    }
    return null
  }

  return (
    <div className={`flex items-center py-3 px-4 border-b border-gray-100 last:border-b-0 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors ${className}`}>
      {/* Book Cover */}
      <div className="flex-shrink-0 mr-3">
        <button
          onClick={() => onBookClick(null, reading.book.id)}
          className="focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
        >
          <BookCover
            src={reading.book.cover_url}
            alt={reading.book.title}
            width={40}
            height={60}
            priority={priority}
            className="rounded border border-gray-200 shadow-sm"
          />
        </button>
      </div>

      {/* Book Info */}
      <div className="flex-1 min-w-0">
        <button
          onClick={() => onBookClick(null, reading.book.id)}
          className="text-left w-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
        >
          <h3 className="font-serif font-semibold text-gray-900 text-base leading-tight line-clamp-1 mb-1">
            {reading.book.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-1 mb-2">
            by {reading.book.author}
          </p>
          
          {/* Progress/Status Info */}
          <div className="flex items-center space-x-2">
            <Badge 
              variant="status" 
              size="sm" 
              color={getStatusColor(reading.status)}
            >
              {getStatusLabel(reading.status)}
            </Badge>
            
            {reading.rating && (
              <Badge variant="rating" size="sm" rating={reading.rating} />
            )}
          </div>
          
          {/* Progress Text */}
          {getProgressText() && (
            <p className="text-xs text-gray-500 mt-1">
              {getProgressText()}
            </p>
          )}
        </button>
      </div>

      {/* Menu Button */}
      <div className="flex-shrink-0 ml-3">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMenuClick?.(reading)
          }}
          className="p-2 text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors rounded-full hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default MobileBookListItem 
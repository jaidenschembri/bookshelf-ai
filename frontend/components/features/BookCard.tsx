import React from 'react'
import Image from 'next/image'
import { BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface BookCardProps {
  book: {
    id: number
    title: string
    author: string
    cover_url?: string
    isbn?: string
  }
  reading?: {
    status: string
    rating?: number
    progress_pages?: number
    total_pages?: number
  }
  onClick?: () => void
  variant?: 'default' | 'compact' | 'featured'
  showProgress?: boolean
  showRating?: boolean
  className?: string
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  reading,
  onClick,
  variant = 'default',
  showProgress = true,
  showRating = true,
  className
}) => {
  const isCompact = variant === 'compact'
  
  return (
    <div
      className={cn(
        'border border-gray-200 p-3 rounded cursor-pointer hover:border-gray-300 transition-colors',
        className
      )}
      onClick={onClick}
    >
      <div className={cn(
        'flex space-x-3',
        isCompact ? 'items-center' : 'items-start'
      )}>
        {/* Book Cover */}
        <div className="flex-shrink-0">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              width={isCompact ? 40 : 64}
              height={isCompact ? 56 : 88}
              className={cn(
                'object-cover rounded border border-gray-200',
                isCompact ? 'w-10 h-14' : 'w-16 h-22'
              )}
              sizes={isCompact ? '40px' : '64px'}
            />
          ) : (
            <div className={cn(
              'bg-gray-50 border border-gray-200 rounded flex items-center justify-center',
              isCompact ? 'w-10 h-14' : 'w-16 h-22'
            )}>
              <BookOpen className={cn(
                'text-gray-400',
                isCompact ? 'h-4 w-4' : 'h-6 w-6'
              )} />
            </div>
          )}
        </div>
        
        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h3 className={cn(
              'font-serif font-medium text-gray-900 hover:underline transition-colors truncate',
              isCompact ? 'text-sm' : 'text-base'
            )}>
              {book.title}
            </h3>
            <p className="text-xs text-gray-500">{book.author}</p>
          </div>
          
          {/* Status and Rating */}
          <div className="flex items-center space-x-2 mb-2">
            {reading?.status && (
              <Badge
                variant="status"
                size="sm"
                color="gray"
              >
                {reading.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            )}
            
            {showRating && reading?.rating && (
              <Badge
                variant="rating"
                size="sm"
                color="gray"
                rating={reading.rating}
              />
            )}
          </div>
          
          {/* Progress Bar (if currently reading) */}
          {showProgress && 
           reading?.status === 'currently_reading' && 
           reading.total_pages && 
           !isCompact && (
            <div className="mt-2">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div 
                  className="bg-gray-600 h-1.5 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${(reading.progress_pages || 0 / reading.total_pages) * 100}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {reading.progress_pages || 0} / {reading.total_pages} pages
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookCard
export { BookCard } 
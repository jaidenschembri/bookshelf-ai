import React from 'react'
import Image from 'next/image'
import { BookOpen } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
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
  const isFeatured = variant === 'featured'
  
  const cardVariant = isFeatured ? 'featured' : 'hover'
  
  return (
    <Card
      variant={cardVariant}
      clickable={!!onClick}
      onClick={onClick}
      padding={isCompact ? 'sm' : 'md'}
      className={cn('w-full', className)}
    >
      <div className={cn(
        'flex space-x-4',
        isCompact ? 'items-center' : 'items-start'
      )}>
        {/* Book Cover */}
        <div className="flex-shrink-0">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              width={isCompact ? 48 : 80}
              height={isCompact ? 64 : 112}
              className={cn(
                'book-cover object-cover',
                isCompact ? 'w-12 h-16' : 'w-20 h-28'
              )}
              sizes={isCompact ? '48px' : '80px'}
            />
          ) : (
            <div className={cn(
              'bg-gray-200 border-4 border-black flex items-center justify-center',
              isCompact ? 'w-12 h-16' : 'w-20 h-28'
            )}>
              <BookOpen className={cn(
                'text-gray-600',
                isCompact ? 'h-6 w-6' : 'h-8 w-8'
              )} />
            </div>
          )}
        </div>
        
        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h3 className={cn(
              'font-serif font-bold text-black hover:underline transition-colors truncate',
              isCompact ? 'text-base' : 'text-lg'
            )}>
              {book.title}
            </h3>
            <p className="text-caption text-gray-600">{book.author}</p>
          </div>
          
          {/* Status and Rating */}
          <div className="flex items-center space-x-2 mb-3">
            {reading?.status && (
              <Badge
                variant="status"
                size="sm"
                color="black"
              >
                {reading.status.replace('_', ' ')}
              </Badge>
            )}
            
            {showRating && reading?.rating && (
              <Badge
                variant="rating"
                size="sm"
                color="black"
                rating={reading.rating}
              />
            )}
          </div>
          
          {/* Progress Bar (if currently reading) */}
          {showProgress && 
           reading?.status === 'currently_reading' && 
           reading.total_pages && 
           !isCompact && (
            <div className="mt-3">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${(reading.progress_pages || 0 / reading.total_pages) * 100}%` 
                  }}
                />
              </div>
              <p className="text-caption text-gray-500 mt-2">
                {reading.progress_pages || 0} / {reading.total_pages} PAGES
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default BookCard
export { BookCard } 
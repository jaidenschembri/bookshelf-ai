import React from 'react'
import Image from 'next/image'
import { BookOpen, Star, Clock, CheckCircle, Edit3, Trash2, MessageSquare, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

export type BookCardMode = 'compact' | 'card' | 'detailed'

export interface BookCardProps {
  book: {
    id: number
    title: string
    author: string
    cover_url?: string
    isbn?: string
    genre?: string
    publication_year?: number
  }
  reading?: {
    id?: number
    status: string
    rating?: number
    progress_pages?: number
    total_pages?: number
    review?: string
    is_review_public?: boolean
  }
  mode?: BookCardMode
  interactive?: boolean
  showProgress?: boolean
  showRating?: boolean
  showControls?: boolean
  onClick?: () => void
  onStatusChange?: (status: string) => void
  onRatingChange?: (rating: number) => void
  onProgressUpdate?: (pages: number) => void
  onEdit?: () => void
  onDelete?: () => void
  onBookClick?: () => void
  className?: string
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  reading,
  mode = 'card',
  interactive = false,
  showProgress = true,
  showRating = true,
  showControls = false,
  onClick,
  onStatusChange,
  onRatingChange,
  onProgressUpdate,
  onEdit,
  onDelete,
  onBookClick,
  className
}) => {
  const isCompact = mode === 'compact'
  const isDetailed = mode === 'detailed'
  const isCard = mode === 'card'

  // Use onBookClick if provided, otherwise fall back to onClick
  const handleBookClick = onBookClick || onClick

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
        return <CheckCircle className="h-4 w-4 text-gray-600" />
      case 'currently_reading':
        return <Clock className="h-4 w-4 text-gray-600" />
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />
    }
  }

  const renderCover = () => {
    const coverSizes = {
      compact: { width: 40, height: 56, class: 'w-10 h-14' },
      card: { width: 64, height: 88, class: 'w-16 h-22' },
      detailed: { width: 96, height: 128, class: 'w-24 h-32' }
    }

    const size = coverSizes[mode]

    return (
      <div className={cn('flex-shrink-0', isDetailed ? 'mx-auto sm:mx-0' : '')}>
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={book.title}
            width={size.width}
            height={size.height}
            className={cn(
              'object-cover rounded border border-gray-200',
              size.class
            )}
            sizes={`${size.width}px`}
          />
        ) : (
          <div className={cn(
            'bg-gray-50 border border-gray-200 rounded flex items-center justify-center',
            size.class
          )}>
            <BookOpen className={cn(
              'text-gray-400',
              isCompact ? 'h-4 w-4' : isDetailed ? 'h-8 w-8' : 'h-6 w-6'
            )} />
          </div>
        )}
      </div>
    )
  }

  const renderBasicInfo = () => (
    <div className={cn('mb-2', isDetailed ? 'text-center sm:text-left mb-4 sm:mb-0' : '')}>
      <h3 className={cn(
        'font-serif font-medium text-gray-900 transition-colors',
        isCompact ? 'text-sm' : isDetailed ? 'text-lg' : 'text-base',
        handleBookClick ? 'hover:underline cursor-pointer' : '',
        isDetailed ? 'mb-1' : 'truncate'
      )}>
        {handleBookClick ? (
          <button
            onClick={handleBookClick}
            className="text-left w-full"
          >
            {book.title}
          </button>
        ) : (
          book.title
        )}
      </h3>
      <p className={cn(
        'text-gray-600',
        isCompact ? 'text-xs text-gray-500' : isDetailed ? 'text-sm mb-3' : 'text-xs text-gray-500'
      )}>
        by {book.author}
      </p>
      
      {isDetailed && (
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-gray-500 mb-3">
          {book.genre && (
            <Badge variant="genre" size="sm" color="gray">
              {book.genre}
            </Badge>
          )}
          {book.publication_year && (
            <span className="text-xs text-gray-500">{book.publication_year}</span>
          )}
        </div>
      )}
    </div>
  )

  const renderStatusAndRating = () => (
    <div className={cn(
      'flex items-center space-x-2 mb-2',
      isDetailed ? 'justify-center sm:justify-start' : ''
    )}>
      {reading?.status && !interactive && (
        <Badge
          variant="status"
          size="sm"
          color="gray"
        >
          {reading.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Badge>
      )}
      
      {showRating && reading?.rating && !interactive && (
        <Badge
          variant="rating"
          size="sm"
          color="gray"
          rating={reading.rating}
        />
      )}
    </div>
  )

  const renderInteractiveStatus = () => {
    if (!interactive || !reading) return null

    return (
      <div className={cn(
        'flex items-center space-x-3 mb-4',
        isDetailed ? 'justify-center sm:justify-start' : ''
      )}>
        {getStatusIcon(reading.status)}
        <select
          value={reading.status}
          onChange={(e) => onStatusChange?.(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
        >
          <option value="want_to_read">Want to Read</option>
          <option value="currently_reading">Currently Reading</option>
          <option value="finished">Finished</option>
        </select>
      </div>
    )
  }

  const renderProgress = () => {
    if (!showProgress || !reading?.status || reading.status !== 'currently_reading' || !reading.total_pages) {
      return null
    }

    const progressPercent = (reading.progress_pages || 0) / reading.total_pages * 100

    if (isCompact) return null

    return (
      <div className="mt-2 mb-4">
        {isDetailed && (
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Reading Progress</span>
            <span>{reading.progress_pages || 0} / {reading.total_pages} pages</span>
          </div>
        )}
        
        <div className={cn(
          'w-full bg-gray-100 rounded-full transition-all duration-300',
          isDetailed ? 'h-2 mb-3' : 'h-1.5'
        )}>
          <div 
            className="bg-gray-600 rounded-full transition-all duration-300"
            style={{ 
              width: `${progressPercent}%`,
              height: isDetailed ? '8px' : '6px'
            }}
          />
        </div>
        
        {interactive && isDetailed && onProgressUpdate && (
          <input
            type="range"
            min="0"
            max={reading.total_pages}
            value={reading.progress_pages || 0}
            onChange={(e) => onProgressUpdate(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        )}
        
        {!isDetailed && (
          <p className="text-xs text-gray-400 mt-1">
            {reading.progress_pages || 0} / {reading.total_pages} pages
          </p>
        )}
      </div>
    )
  }

  const renderInteractiveRating = () => {
    if (!interactive || !reading) return null

    return (
      <div className={cn(
        'flex space-y-2 mb-4',
        isDetailed ? 'flex-col sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3' : 'flex-row items-center space-x-3 space-y-0'
      )}>
        <span className={cn(
          'text-xs text-gray-500',
          isDetailed ? 'text-center sm:text-left' : ''
        )}>
          Rating:
        </span>
        <div className={cn(
          'flex items-center space-x-2',
          isDetailed ? 'justify-center sm:justify-start' : ''
        )}>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => onRatingChange?.(star)}
                className={cn(
                  'transition-colors',
                  reading.rating && star <= reading.rating
                    ? 'text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-400'
                )}
              >
                <Star className="h-4 w-4 fill-current" />
              </button>
            ))}
          </div>
          {reading.rating && (
            <span className="text-xs text-gray-500">({reading.rating}/5)</span>
          )}
        </div>
      </div>
    )
  }

  const renderReview = () => {
    if (!isDetailed || !reading) return null

    return reading.review ? (
      <div className="bg-gray-50 p-4 rounded mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 space-y-2 sm:space-y-0">
          <h4 className="text-sm font-medium text-gray-900 text-center sm:text-left">My Review</h4>
          <div className="flex items-center justify-center sm:justify-start space-x-2">
            <Badge
              variant="status"
              size="sm"
              color="gray"
            >
              <div className="flex items-center space-x-1">
                {reading.is_review_public ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span>{reading.is_review_public ? 'Public' : 'Private'}</span>
              </div>
            </Badge>
            {showControls && onEdit && (
              <button
                onClick={onEdit}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                title="Edit review"
              >
                <Edit3 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-700 text-center sm:text-left leading-relaxed">{reading.review}</p>
      </div>
    ) : showControls && onEdit ? (
      <button
        onClick={onEdit}
        className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
      >
        <MessageSquare className="h-4 w-4" />
        <span>Add a review</span>
      </button>
    ) : null
  }

  const renderControls = () => {
    if (!showControls || !isDetailed) return null

    return (
      <div className="flex items-center justify-center sm:justify-start space-x-2">
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
            title="Edit review"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 rounded transition-colors"
            title="Remove from library"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  // Main render logic
  const cardClasses = cn(
    'border border-gray-200 rounded',
    isDetailed ? 'p-6' : 'p-3',
    !isDetailed && onClick ? 'cursor-pointer hover:border-gray-300 transition-colors' : '',
    className
  )

  const contentClasses = cn(
    'flex',
    isDetailed ? 'flex-col sm:flex-row gap-6' : 'space-x-3',
    isCompact ? 'items-center' : 'items-start'
  )

  return (
    <div className={cardClasses} onClick={!isDetailed ? onClick : undefined}>
      <div className={contentClasses}>
        {renderCover()}
        
        <div className="flex-1 min-w-0">
          {isDetailed && (
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
              {renderBasicInfo()}
              {renderControls()}
            </div>
          )}
          
          {!isDetailed && renderBasicInfo()}
          
          {!interactive && renderStatusAndRating()}
          {renderInteractiveStatus()}
          {renderProgress()}
          {interactive && renderInteractiveRating()}
          {renderReview()}
        </div>
      </div>
    </div>
  )
}

export default BookCard
export { BookCard } 
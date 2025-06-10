import React from 'react'
import Image from 'next/image'
import { BookOpen, Star, Clock, CheckCircle, Edit3, Trash2, MessageSquare, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface DetailedBookCardProps {
  reading: {
    id: number
    status: string
    rating?: number
    review?: string
    is_review_public?: boolean
    progress_pages: number
    total_pages?: number
    book: {
      id: number
      title: string
      author: string
      cover_url?: string
      genre?: string
      publication_year?: number
    }
  }
  onStatusChange: (status: string) => void
  onRatingChange: (rating: number) => void
  onProgressUpdate: (pages: number) => void
  onEdit: () => void
  onDelete: () => void
  onBookClick: () => void
  className?: string
}

const DetailedBookCard: React.FC<DetailedBookCardProps> = ({
  reading,
  onStatusChange,
  onRatingChange,
  onProgressUpdate,
  onEdit,
  onDelete,
  onBookClick,
  className
}) => {
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

  return (
    <div className={cn("border border-gray-200 p-6 rounded", className)}>
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Book Cover */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          {reading.book.cover_url ? (
            <Image
              src={reading.book.cover_url}
              alt={reading.book.title}
              width={96}
              height={128}
              className="object-cover rounded border border-gray-200"
              style={{ width: '96px', height: 'auto' }}
              sizes="96px"
            />
          ) : (
            <div className="w-24 h-32 bg-gray-50 border border-gray-200 rounded flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Book Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
              <h3 className="text-lg font-semibold font-serif mb-1">
                <button
                  onClick={onBookClick}
                  className="text-gray-900 hover:underline transition-colors text-left"
                >
                  {reading.book.title}
                </button>
              </h3>
              <p className="text-sm text-gray-600 mb-3">by {reading.book.author}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-gray-500 mb-3">
                {reading.book.genre && (
                  <Badge variant="genre" size="sm" color="gray">
                    {reading.book.genre}
                  </Badge>
                )}
                {reading.book.publication_year && (
                  <span className="text-xs text-gray-500">{reading.book.publication_year}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
                title="Edit review"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-red-600 rounded transition-colors"
                title="Remove from library"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center sm:justify-start space-x-3 mb-4">
            {getStatusIcon(reading.status)}
            <select
              value={reading.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              <option value="want_to_read">Want to Read</option>
              <option value="currently_reading">Currently Reading</option>
              <option value="finished">Finished</option>
            </select>
          </div>

          {/* Progress Bar (for currently reading) */}
          {reading.status === 'currently_reading' && reading.total_pages && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Reading Progress</span>
                <span>{reading.progress_pages} / {reading.total_pages} pages</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${(reading.progress_pages / reading.total_pages) * 100}%` 
                  }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={reading.total_pages}
                value={reading.progress_pages}
                onChange={(e) => onProgressUpdate(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Rating */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4">
            <span className="text-xs text-gray-500 text-center sm:text-left">Rating:</span>
            <div className="flex justify-center sm:justify-start items-center space-x-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => onRatingChange(star)}
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

          {/* Review */}
          {reading.review ? (
            <div className="bg-gray-50 p-4 rounded mb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 space-y-2 sm:space-y-0">
                <h4 className="text-sm font-medium text-gray-900 text-center sm:text-left">My Review</h4>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Badge
                    variant="status"
                    size="sm"
                    color="gray"
                    icon={reading.is_review_public ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  >
                    {reading.is_review_public ? 'Public' : 'Private'}
                  </Badge>
                  <button
                    onClick={onEdit}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    title="Edit review"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700 text-center sm:text-left leading-relaxed">{reading.review}</p>
            </div>
          ) : (
            <button
              onClick={onEdit}
              className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Add a review</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetailedBookCard
export { DetailedBookCard } 
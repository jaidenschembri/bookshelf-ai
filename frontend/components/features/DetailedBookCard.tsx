import React from 'react'
import Image from 'next/image'
import { BookOpen, Star, Clock, CheckCircle, Edit3, Trash2, MessageSquare, Eye, EyeOff } from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
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
        return <CheckCircle className="h-5 w-5 text-black" />
      case 'currently_reading':
        return <Clock className="h-5 w-5 text-black" />
      default:
        return <BookOpen className="h-5 w-5 text-black" />
    }
  }

  return (
    <Card variant="default" padding="lg" className={className}>
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Book Cover */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          {reading.book.cover_url ? (
            <Image
              src={reading.book.cover_url}
              alt={reading.book.title}
              width={120}
              height={160}
              className="book-cover object-cover"
              style={{ width: '120px', height: 'auto' }}
              sizes="120px"
            />
          ) : (
            <div className="w-30 h-40 bg-gray-200 border-4 border-black flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-gray-600" />
            </div>
          )}
        </div>

        {/* Book Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
              <h3 className="heading-sm mb-2">
                <button
                  onClick={onBookClick}
                  className="text-black hover:underline transition-colors text-left"
                >
                  {reading.book.title}
                </button>
              </h3>
              <p className="text-body text-gray-600 mb-3">by {reading.book.author}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-gray-500 mb-3">
                {reading.book.genre && (
                  <Badge variant="genre" size="sm" color="gray">
                    {reading.book.genre}
                  </Badge>
                )}
                {reading.book.publication_year && (
                  <span className="text-caption text-gray-600">{reading.book.publication_year}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                icon={<Edit3 className="h-4 w-4" />}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                icon={<Trash2 className="h-4 w-4" />}
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center sm:justify-start space-x-3 mb-4">
            {getStatusIcon(reading.status)}
            <select
              value={reading.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="input-field w-full sm:w-auto max-w-xs"
            >
              <option value="want_to_read">Want to Read</option>
              <option value="currently_reading">Currently Reading</option>
              <option value="finished">Finished</option>
            </select>
          </div>

          {/* Progress Bar (for currently reading) */}
          {reading.status === 'currently_reading' && reading.total_pages && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-caption text-gray-600 mb-2">
                <span>READING PROGRESS</span>
                <span>{reading.progress_pages} / {reading.total_pages} PAGES</span>
              </div>
              <div className="progress-bar mb-3">
                <div 
                  className="progress-fill" 
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
                className="w-full"
              />
            </div>
          )}

          {/* Rating */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4">
            <span className="text-caption text-gray-600 text-center sm:text-left">RATING:</span>
            <div className="flex justify-center sm:justify-start items-center space-x-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => onRatingChange(star)}
                    className={cn(
                      'transition-colors',
                      reading.rating && star <= reading.rating
                        ? 'text-black'
                        : 'text-gray-300 hover:text-black'
                    )}
                  >
                    <Star className="h-5 w-5 fill-current" />
                  </button>
                ))}
              </div>
              {reading.rating && (
                <span className="text-caption text-gray-600">({reading.rating}/5)</span>
              )}
            </div>
          </div>

          {/* Review */}
          {reading.review ? (
            <Card variant="flat" padding="md" className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 space-y-2 sm:space-y-0">
                <h4 className="heading-sm text-center sm:text-left">MY REVIEW</h4>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Badge
                    variant="status"
                    size="sm"
                    color="black"
                    icon={reading.is_review_public ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  >
                    {reading.is_review_public ? 'PUBLIC' : 'PRIVATE'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    icon={<Edit3 className="h-3 w-3" />}
                  />
                </div>
              </div>
              <p className="text-body text-gray-700 text-center sm:text-left">{reading.review}</p>
            </Card>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              icon={<MessageSquare className="h-4 w-4" />}
              className="mb-4"
            >
              Add a review
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default DetailedBookCard 
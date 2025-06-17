import React from 'react'
import { Star, Heart, MessageCircle } from 'lucide-react'
import { BookCover } from '@/components/ui'
import { Reading } from '@/lib/api'

export interface ReviewCardProps {
  reading: Reading
  onBookClick: (book: any, bookId?: number) => void
  priority?: boolean
  className?: string
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  reading,
  onBookClick,
  priority = false,
  className = ''
}) => {
  return (
    <div className={`border border-gray-200 p-6 rounded bg-white ${className}`}>
      <div className="flex space-x-4">
        <div className="flex-shrink-0">
          <BookCover
            src={reading.book.cover_url}
            alt={reading.book.title}
            width={80}
            height={120}
            priority={priority}
            className="border border-gray-200 rounded"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => onBookClick(null, reading.book.id)}
              className="font-serif font-bold text-lg text-black hover:text-blue-600 hover:underline text-left transition-colors"
            >
              {reading.book.title}
            </button>
            {reading.rating && (
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < reading.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">by {reading.book.author}</p>
          
          {reading.review && (
            <div className="mb-4">
              <p className="text-gray-700">{reading.review}</p>
            </div>
          )}

          {/* Review interactions */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span>{reading.like_count || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>{reading.comment_count || 0}</span>
            </div>
            <span>{new Date(reading.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewCard 
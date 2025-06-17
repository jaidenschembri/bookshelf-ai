import React from 'react'
import Link from 'next/link'
import { Heart, MessageCircle } from 'lucide-react'
import { BookCard } from '@/components/features'
import { Badge } from '@/components/ui'
import { Reading } from '@/lib/api'

export interface ReviewCardProps {
  reading: Reading
  onBookClick: (book: any, bookId?: number) => void
  onLike?: (readingId: number) => void
  onComment?: (readingId: number) => void
  priority?: boolean
  className?: string
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  reading,
  onBookClick,
  onLike,
  onComment,
  priority = false,
  className = ''
}) => {
  return (
    <div className={`border-b border-gray-100 pb-4 last:border-b-0 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <BookCard
            book={reading.book}
            reading={{
              status: reading.status,
              rating: reading.rating,
              progress_pages: reading.progress_pages,
              total_pages: reading.total_pages
            }}
            onClick={() => onBookClick(null, reading.book.id)}
            mode="compact"
            priority={priority}
          />
        </div>
        <div className="flex-1 min-w-0">
          {reading.user && (
            <Link href={`/user/${reading.user.id}`}>
              <p className="text-sm font-medium text-gray-900 hover:underline cursor-pointer mb-2">
                Review by {reading.user.name}
              </p>
            </Link>
          )}
          {reading.rating && (
            <div className="flex items-center mb-2">
              <Badge variant="rating" size="sm" color="gray" rating={reading.rating} />
            </div>
          )}
          {reading.review && (
            <p className="text-sm text-gray-600 mb-3">
              {reading.review}
            </p>
          )}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <button 
              className="flex items-center space-x-1 hover:text-red-500 transition-colors"
              onClick={() => onLike?.(reading.id)}
            >
              <Heart className="h-4 w-4" />
              <span>Like</span>
            </button>
            <button 
              className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
              onClick={() => onComment?.(reading.id)}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Comment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewCard 
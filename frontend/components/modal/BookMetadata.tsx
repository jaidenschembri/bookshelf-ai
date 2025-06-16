import React from 'react'
import { Calendar, BookOpen, Hash, Users, Star } from 'lucide-react'
import { Book } from '@/lib/api'

export interface BookMetadataProps {
  book: Book
  showRatings?: boolean
  className?: string
}

const BookMetadata: React.FC<BookMetadataProps> = ({
  book,
  showRatings = true,
  className
}) => {
  const hasMetadata = book.publication_year || book.total_pages || book.isbn || book.genre

  return (
    <div className={className}>
      {/* Metadata Grid */}
      {hasMetadata && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {book.publication_year && (
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-gray-600">Published: {book.publication_year}</span>
            </div>
          )}
          
          {book.total_pages && (
            <div className="flex items-center space-x-2 text-sm">
              <BookOpen className="h-4 w-4 text-gray-600" />
              <span className="text-gray-600">{book.total_pages} pages</span>
            </div>
          )}
          
          {book.isbn && (
            <div className="flex items-center space-x-2 text-sm">
              <Hash className="h-4 w-4 text-gray-600" />
              <span className="text-gray-600">ISBN: {book.isbn}</span>
            </div>
          )}
          
          {book.genre && (
            <div className="flex items-center space-x-2 text-sm">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-gray-600">Genre: {book.genre}</span>
            </div>
          )}
        </div>
      )}

      {/* Ratings */}
      {showRatings && book.total_ratings && book.total_ratings > 0 && (
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
          <span className="text-sm text-gray-600">
            {book.average_rating?.toFixed(1)} ({book.total_ratings} rating{book.total_ratings !== 1 ? 's' : ''})
          </span>
        </div>
      )}
    </div>
  )
}

export default BookMetadata 
import React from 'react'
import { Book } from '@/lib/api'
import { BookCover, BookMetadata } from '@/components/ui'

export interface BookDetailsProps {
  book: Book
  className?: string
}

const BookDetails: React.FC<BookDetailsProps> = ({
  book,
  className
}) => {
  return (
    <div className={className}>
      {/* Book Cover and Basic Info */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Cover */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          <BookCover
            src={book.cover_url}
            alt={book.title}
            size="xl"
            shadow
          />
        </div>

        {/* Basic Info */}
        <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-gray-900 mb-2 leading-tight">
              {book.title}
            </h1>
            <p className="text-base sm:text-lg text-gray-700 mb-3 sm:mb-4">
              by {book.author}
            </p>
          </div>

          {/* Metadata */}
          <BookMetadata book={book} showRatings />
        </div>
      </div>

      {/* Description */}
      {book.description && (
        <div className="border-t border-gray-200 pt-4 sm:pt-6">
          <h3 className="text-base sm:text-lg font-semibold font-serif text-gray-900 mb-2 sm:mb-3">Description</h3>
          <div className="prose prose-sm max-w-none text-gray-700">
            <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed">{book.description}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookDetails 
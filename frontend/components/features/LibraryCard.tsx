import React from 'react'
import Image from 'next/image'
import { BookOpen, Star } from 'lucide-react'
import { Reading } from '@/lib/api'

export interface LibraryCardProps {
  reading: Reading
  onBookClick: (book: any, bookId?: number) => void
  className?: string
}

const LibraryCard: React.FC<LibraryCardProps> = ({
  reading,
  onBookClick,
  className = ''
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished': return 'bg-green-100 text-green-800'
      case 'currently_reading': return 'bg-blue-100 text-blue-800'
      case 'want_to_read': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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

  return (
    <div className={`border border-gray-200 p-4 rounded bg-white ${className}`}>
      <div className="flex space-x-4">
        <div className="flex-shrink-0">
          {reading.book.cover_url ? (
            <Image
              src={reading.book.cover_url}
              alt={reading.book.title}
              width={80}
              height={120}
              className="object-cover border border-gray-200 rounded"
              style={{ width: '80px', height: 'auto' }}
            />
          ) : (
            <div className="w-20 h-28 bg-gray-200 border border-gray-200 rounded flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-gray-600" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onBookClick(null, reading.book.id)}
            className="font-serif font-bold text-lg mb-1 line-clamp-2 text-black hover:text-blue-600 hover:underline text-left transition-colors"
          >
            {reading.book.title}
          </button>
          <p className="text-sm text-gray-600 mb-2">{reading.book.author}</p>
          
          <div className="flex items-center space-x-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(reading.status)}`}>
              {getStatusLabel(reading.status)}
            </span>
            {reading.rating && (
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < reading.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {reading.review && reading.is_review_public && (
            <p className="text-sm text-gray-700 line-clamp-2">{reading.review}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default LibraryCard 
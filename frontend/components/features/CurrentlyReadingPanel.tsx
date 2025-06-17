import React from 'react'
import { Reading } from '@/lib/api'
import { BookCover } from '@/components/ui'
import { MoreHorizontal } from 'lucide-react'

export interface CurrentlyReadingPanelProps {
  currentBooks: Reading[]
  onBookClick: (book: any, bookId?: number) => void
  isMobile?: boolean
  className?: string
}

const CurrentlyReadingPanel: React.FC<CurrentlyReadingPanelProps> = ({
  currentBooks,
  onBookClick,
  isMobile = false,
  className = ''
}) => {
  // Filter for currently reading books only
  const currentlyReading = currentBooks.filter(reading => reading.status === 'currently_reading')

  if (currentlyReading.length === 0) {
    return (
      <div className={`${isMobile ? '' : 'sticky top-8'} ${className}`}>
        <div>
          <h2 className="text-lg font-semibold mb-4 text-black">Currently reading</h2>
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No books currently being read</p>
            <p className="text-gray-500 text-xs mt-1">Start reading a book to see it here</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${isMobile ? '' : 'sticky top-8'} ${className}`}>
      <div>
        <h2 className="text-lg font-semibold mb-4 text-black">
          Currently reading
          <span className="text-sm font-normal text-gray-400 ml-2">
            {currentlyReading.length} Book{currentlyReading.length !== 1 ? 's' : ''}
          </span>
        </h2>
        
        <div className="space-y-4">
          {currentlyReading.map((reading) => (
            <div key={reading.id} className="group">
              <div 
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onBookClick(reading.book, reading.book.id)}
              >
                {/* Book Cover */}
                <div className="flex-shrink-0">
                  <BookCover
                    src={reading.book.cover_url}
                    alt={reading.book.title}
                    width={48}
                    height={64}
                    className="rounded shadow-sm"
                  />
                </div>

                {/* Book Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight">
                    {reading.book.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {reading.book.author}
                  </p>
                  
                  {/* Progress Bar */}
                  {reading.progress_pages && reading.book.total_pages && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>
                          {reading.progress_pages} / {reading.book.total_pages} pages
                        </span>
                        <span>
                          {Math.round((reading.progress_pages / reading.book.total_pages) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-black h-1.5 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min((reading.progress_pages / reading.book.total_pages) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Menu Button */}
                <div className="flex-shrink-0">
                  <button 
                    className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Implement book menu
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CurrentlyReadingPanel 
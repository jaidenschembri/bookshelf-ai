import React from 'react'
import { BookCard } from '@/components/features'
import { ComponentErrorBoundary } from '@/components/ErrorBoundary'
import { Reading } from '@/lib/api'

export interface DashboardCurrentBooksProps {
  currentBooks: Reading[]
  onBookClick: (book: any, bookId?: number) => void
  className?: string
}

const DashboardCurrentBooks: React.FC<DashboardCurrentBooksProps> = ({
  currentBooks,
  onBookClick,
  className = ''
}) => {
  if (!currentBooks || currentBooks.length === 0) {
    return null
  }

  return (
    <ComponentErrorBoundary componentName="Current Books">
      <div className={`mb-8 ${className}`}>
        <h2 className="text-lg font-semibold font-serif tracking-tight mb-4">Currently Reading</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentBooks.map((reading) => (
            <BookCard
              key={reading.id}
              book={reading.book}
              reading={reading}
              onClick={() => onBookClick(reading.book, reading.book.id)}
              variant="default"
              showProgress={true}
            />
          ))}
        </div>
      </div>
    </ComponentErrorBoundary>
  )
}

export default DashboardCurrentBooks 
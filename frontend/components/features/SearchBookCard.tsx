import Image from 'next/image'
import { BookOpen, Plus, Check } from 'lucide-react'
import { BookSearch } from '@/lib/api'
import { cn } from '@/lib/utils'

interface SearchBookCardProps {
  book: BookSearch
  index: number
  isAdded: boolean
  isLoading: boolean
  onAddBook: (book: BookSearch, status: string) => void
  onOpenModal: (book: any) => void
}

export function SearchBookCard({ 
  book, 
  index, 
  isAdded, 
  isLoading, 
  onAddBook, 
  onOpenModal 
}: SearchBookCardProps) {
  const handleOpenModal = () => {
    onOpenModal({
      // No id field - this tells the modal we have a complete book object from search
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      cover_url: book.cover_url,
      description: book.description,
      publication_year: book.publication_year,
      created_at: new Date().toISOString(),
      genre: undefined,
      total_pages: undefined,
    })
  }

  return (
    <div className="border border-gray-200 p-6 rounded">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Book Cover */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
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
          <div className="text-center sm:text-left mb-4">
            <h3 className="text-lg font-semibold font-serif mb-1">
              <button
                onClick={handleOpenModal}
                className="text-gray-900 hover:underline transition-colors text-left"
              >
                {book.title}
              </button>
            </h3>
            <p className="text-sm text-gray-600 mb-3">by {book.author}</p>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-gray-500 mb-3">
              {book.publication_year && (
                <span className="text-xs text-gray-500">Published: {book.publication_year}</span>
              )}
              {book.isbn && (
                <span className="text-xs text-gray-500">ISBN: {book.isbn}</span>
              )}
            </div>
          </div>

          {book.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed text-center sm:text-left">
              {book.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
            {isAdded ? (
              <div className="flex items-center justify-center text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Added to library
              </div>
            ) : (
              <>
                <button
                  onClick={() => onAddBook(book, 'want_to_read')}
                  disabled={isLoading}
                  className="inline-flex items-center space-x-2 bg-white text-gray-700 border border-gray-300 px-3 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  <span>Want to Read</span>
                </button>
                <button
                  onClick={() => onAddBook(book, 'currently_reading')}
                  disabled={isLoading}
                  className="inline-flex items-center space-x-2 bg-gray-900 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  <span>Currently Reading</span>
                </button>
                <button
                  onClick={() => onAddBook(book, 'finished')}
                  disabled={isLoading}
                  className="inline-flex items-center space-x-2 bg-white text-gray-700 border border-gray-300 px-3 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  <span>Finished</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
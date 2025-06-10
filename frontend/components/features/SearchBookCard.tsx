import Image from 'next/image'
import { BookOpen, Plus, Check } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { BookSearch } from '@/lib/api'

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
    <Card key={`${book.title}-${index}`}>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Book Cover */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              width={120}
              height={160}
              className="rounded-lg object-cover shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              style={{ width: '120px', height: 'auto' }}
              sizes="120px"
            />
          ) : (
            <div className="w-30 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Book Details */}
        <div className="flex-1 min-w-0">
          <h3 className="heading-lg mb-2">
            <button
              onClick={handleOpenModal}
              className="text-black hover:underline text-left transition-all"
            >
              {book.title}
            </button>
          </h3>
          <p className="text-body text-gray-600 mb-2">by {book.author}</p>
          
          {book.publication_year && (
            <p className="text-caption text-gray-500 mb-2">
              Published: {book.publication_year}
            </p>
          )}
          
          {book.isbn && (
            <p className="text-caption text-gray-500 mb-4">
              ISBN: {book.isbn}
            </p>
          )}

          {book.description && (
            <p className="text-caption text-gray-600 mb-4 line-clamp-3">
              {book.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {isAdded ? (
              <div className="flex items-center text-black text-caption">
                <Check className="h-4 w-4 mr-1" />
                Added to library
              </div>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onAddBook(book, 'want_to_read')}
                  disabled={isLoading}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Want to Read
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onAddBook(book, 'currently_reading')}
                  disabled={isLoading}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Currently Reading
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onAddBook(book, 'finished')}
                  disabled={isLoading}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Finished
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
} 
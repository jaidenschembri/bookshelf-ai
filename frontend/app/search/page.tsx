'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import { bookApi, readingApi, BookSearch } from '@/lib/api'
import { Search, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useBookModal } from '@/contexts/BookModalContext'
import { Input, Button, Card } from '@/components/ui'
import { SearchBookCard } from '@/components/features'

export default function SearchPage() {
  const { data: session } = useSession()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookSearch[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addedBooks, setAddedBooks] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()
  const { openBookModal } = useBookModal()

  const addBookMutation = useMutation(
    async ({ book, status }: { book: BookSearch; status: string }) => {
      // First add the book to the database
      const addedBook = await bookApi.add({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        cover_url: book.cover_url,
        description: book.description,
        publication_year: book.publication_year,
      })

      // Then create a reading entry
      await readingApi.create({
        book_id: addedBook.id,
        status,
      })

      return addedBook
    },
    {
      onSuccess: (_, variables) => {
        toast.success(`Added "${variables.book.title}" to your library!`)
        setAddedBooks(prev => new Set(prev).add(variables.book.title))
        queryClient.invalidateQueries(['dashboard'])
        queryClient.invalidateQueries(['readings'])
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to add book')
      },
    }
  )

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const searchResults = await bookApi.search(query, 20)
      setResults(searchResults)
    } catch (error) {
      toast.error('Failed to search books. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddBook = (book: BookSearch, status: string) => {
    if (!session?.user?.id) {
      toast.error('Please sign in to add books')
      return
    }

    addBookMutation.mutate({ book, status })
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-xl text-black">Search Books</h1>
          <p className="text-body text-gray-600 mt-2">Find books to add to your library</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for books by title, author, or ISBN..."
                icon={<Search className="h-5 w-5" />}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={isSearching || !query.trim()}
              loading={isSearching}
              className="w-full sm:w-auto"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </Card>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className="heading-lg text-black">
              Search Results ({results.length})
            </h2>
            
            <div className="grid gap-6">
              {results.map((book, index) => (
                <SearchBookCard
                  key={`${book.title}-${index}`}
                  book={book}
                  index={index}
                  isAdded={addedBooks.has(book.title)}
                  isLoading={addBookMutation.isLoading}
                  onAddBook={handleAddBook}
                  onOpenModal={openBookModal}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && results.length === 0 && query && (
          <Card variant="flat" className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="heading-lg text-black mb-2">No books found</h3>
            <p className="text-body text-gray-600">
              Try searching with different keywords or check your spelling.
            </p>
          </Card>
        )}

        {/* Initial State */}
        {!query && results.length === 0 && (
          <Card variant="flat" className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="heading-lg text-black mb-2">
              Search for books to add to your library
            </h3>
            <p className="text-body text-gray-600">
              Enter a book title, author name, or ISBN to get started.
            </p>
          </Card>
        )}
      </div>
    </Layout>
  )
} 
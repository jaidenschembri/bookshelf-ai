'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import { bookApi, readingApi, BookSearch } from '@/lib/api'
import { Search, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useBookModal } from '@/contexts/BookModalContext'
import { SearchBookCard } from '@/components/features'
import { useErrorHandler } from '@/lib/error-handling'

export default function SearchPage() {
  const { data: session } = useSession()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookSearch[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addedBooks, setAddedBooks] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()
  const { openBookModal } = useBookModal()
  const handleError = useErrorHandler()

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
      onError: (error: any, variables) => {
        handleError(error, {
          context: 'add_book_from_search',
          bookTitle: variables.book.title
        })
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
      handleError(error, {
        context: 'search_books',
        query: query
      })
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
          <h1 className="text-2xl font-semibold font-serif tracking-tight mb-2">Search Books</h1>
          <p className="text-sm text-gray-600">Find books to add to your library</p>
        </div>

        {/* Search Form */}
        <div className="border border-gray-200 p-6 rounded mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for books by title, author, or ISBN..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="inline-flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold font-serif tracking-tight">
                Search Results
              </h2>
              <span className="text-sm text-gray-500">
                {results.length} book{results.length !== 1 ? 's' : ''} found
              </span>
            </div>
            
            <div className="space-y-4">
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
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold font-serif mb-2">No books found</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Try searching with different keywords or check your spelling.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!query && results.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold font-serif mb-2">
              Search for books to add to your library
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Enter a book title, author name, or ISBN to get started.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
} 
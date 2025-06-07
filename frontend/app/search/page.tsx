'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import { bookApi, readingApi, BookSearch } from '@/lib/api'
import { Search, BookOpen, Plus, Check } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function SearchPage() {
  const { data: session } = useSession()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookSearch[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addedBooks, setAddedBooks] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()

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
          <h1 className="text-3xl font-bold text-gray-900">Search Books</h1>
          <p className="text-gray-600 mt-2">Find books to add to your library</p>
        </div>

        {/* Search Form */}
        <div className="card mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for books by title, author, or ISBN..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Search Results ({results.length})
            </h2>
            
            <div className="grid gap-6">
              {results.map((book, index) => (
                <div key={`${book.title}-${index}`} className="card">
                  <div className="flex gap-6">
                    {/* Book Cover */}
                    <div className="flex-shrink-0">
                      {book.cover_url ? (
                        <Image
                          src={book.cover_url}
                          alt={book.title}
                          width={120}
                          height={160}
                          className="rounded-lg object-cover shadow-sm"
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {book.title}
                      </h3>
                      <p className="text-gray-600 mb-2">by {book.author}</p>
                      
                      {book.publication_year && (
                        <p className="text-sm text-gray-500 mb-2">
                          Published: {book.publication_year}
                        </p>
                      )}
                      
                      {book.isbn && (
                        <p className="text-sm text-gray-500 mb-4">
                          ISBN: {book.isbn}
                        </p>
                      )}

                      {book.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {book.description}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {addedBooks.has(book.title) ? (
                          <div className="flex items-center text-green-600 text-sm">
                            <Check className="h-4 w-4 mr-1" />
                            Added to library
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleAddBook(book, 'want_to_read')}
                              disabled={addBookMutation.isLoading}
                              className="btn-secondary text-sm disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Want to Read
                            </button>
                            <button
                              onClick={() => handleAddBook(book, 'currently_reading')}
                              disabled={addBookMutation.isLoading}
                              className="btn-primary text-sm disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Currently Reading
                            </button>
                            <button
                              onClick={() => handleAddBook(book, 'finished')}
                              disabled={addBookMutation.isLoading}
                              className="btn-secondary text-sm disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Finished
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && results.length === 0 && query && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-600">
              Try searching with different keywords or check your spelling.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!query && results.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Search for books to add to your library
            </h3>
            <p className="text-gray-600">
              Enter a book title, author name, or ISBN to get started.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
} 
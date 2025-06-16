'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, BookOpen, Plus, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { bookApi, readingApi, BookSearch } from '@/lib/api'
import { useBookModal } from '@/contexts/BookModalContext'
import { useErrorHandler } from '@/lib/error-handling'
import { cn } from '@/lib/utils'

export interface GlobalSearchProps {
  className?: string
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ className = '' }) => {
  const { data: session } = useSession()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookSearch[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [addedBooks, setAddedBooks] = useState<Set<string>>(new Set())
  const [focusedIndex, setFocusedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { openBookModal } = useBookModal()
  const handleError = useErrorHandler()

  const addBookMutation = useMutation(
    async ({ book, status }: { book: BookSearch; status: string }) => {
      const addedBook = await bookApi.add({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        cover_url: book.cover_url,
        description: book.description,
        publication_year: book.publication_year,
      })

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

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsSearching(true)
    try {
      const searchResults = await bookApi.search(searchQuery, 8) // Limit results for dropdown
      setResults(searchResults)
      setIsOpen(true)
      setFocusedIndex(-1)
    } catch (error) {
      handleError(error, {
        context: 'search_books',
        query: searchQuery
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
  }

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        handleSearch(query)
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < results.length) {
          handleBookClick(results[focusedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setFocusedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleBookClick = (book: BookSearch) => {
    const bookForModal = {
      id: 0, // Temporary ID for search results
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      cover_url: book.cover_url,
      description: book.description,
      publication_year: book.publication_year,
      created_at: new Date().toISOString(),
      genre: undefined,
      total_pages: undefined,
    }
    openBookModal(bookForModal)
    handleClose()
  }

  const handleAddBook = (book: BookSearch, status: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!session?.user?.id) {
      toast.error('Please sign in to add books')
      return
    }
    addBookMutation.mutate({ book, status })
  }

  const handleClose = () => {
    setIsOpen(false)
    setQuery('')
    setResults([])
    setFocusedIndex(-1)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn('relative flex-1 max-w-lg', className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search for books..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
        />
        {(query || isOpen) && (
          <button
            onClick={handleClose}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {isSearching && (
            <div className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Search className="h-4 w-4 text-gray-400 animate-pulse" />
                <span className="text-sm text-gray-600">Searching...</span>
              </div>
            </div>
          )}

          {!isSearching && results.length === 0 && query && (
            <div className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No books found</p>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="py-2">
              {results.map((book, index) => (
                <div
                  key={`${book.title}-${index}`}
                  className={cn(
                    'flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0',
                    focusedIndex === index && 'bg-gray-50'
                  )}
                  onClick={() => handleBookClick(book)}
                >
                  {/* Book Cover */}
                  <div className="flex-shrink-0 mr-3">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-10 h-14 object-cover rounded border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {book.title}
                    </h4>
                    <p className="text-xs text-gray-600 truncate">
                      by {book.author}
                    </p>
                    {book.publication_year && (
                      <p className="text-xs text-gray-500">
                        {book.publication_year}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {session?.user?.id && (
                    <div className="flex-shrink-0 ml-3">
                      {addedBooks.has(book.title) ? (
                        <div className="flex items-center text-xs text-green-600">
                          <Check className="h-4 w-4 mr-1" />
                          Added
                        </div>
                      ) : (
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => handleAddBook(book, 'want_to_read', e)}
                            disabled={addBookMutation.isLoading}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Want to Read"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch 
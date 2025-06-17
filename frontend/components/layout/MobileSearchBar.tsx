'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, BookOpen, Plus, Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { bookApi, readingApi, BookSearch } from '@/lib/api'
import { useBookModal } from '@/contexts/BookModalContext'
import { useErrorHandler } from '@/lib/error-handling'
import { cn } from '@/lib/utils'

export interface MobileSearchBarProps {
  className?: string
  onSearchFocus?: () => void
  onSearchBlur?: () => void
}

const MobileSearchBar: React.FC<MobileSearchBarProps> = ({ 
  className = '',
  onSearchFocus,
  onSearchBlur
}) => {
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
      const searchResults = await bookApi.search(searchQuery, 6) // Fewer results for mobile
      setResults(searchResults)
      setIsOpen(true)
      setFocusedIndex(-1)
    } catch (error) {
      handleError(error, {
        context: 'mobile_search_books',
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
        handleClose()
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
    inputRef.current?.blur()
    onSearchBlur?.()
  }

  const handleFocus = () => {
    if (query) setIsOpen(true)
    onSearchFocus?.()
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
    <div className={cn('relative w-full', className)}>
      {/* Search Input - Mobile Optimized */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
          {isSearching ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder="Search for books..."
          className={cn(
            "w-full pl-10 pr-10 py-2 text-sm", // Smaller padding and text for compact header
            "border border-gray-300 rounded-md",
            "bg-white focus:bg-white",
            "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent",
            "placeholder-gray-500",
            "transition-all duration-200",
            // Mobile-specific styles
            "h-8", // Fixed height instead of min-height
            "text-[16px]", // Prevents zoom on iOS
            isOpen && "rounded-b-none border-b-0"
          )}
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={handleClose}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

            {/* Search Results Dropdown - Floating */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute top-full left-0 right-0 z-50",
            "mt-1", // Gap between search bar and dropdown
            "bg-white border border-gray-300 rounded-md",
            "max-h-96 overflow-y-auto search-results",
            "shadow-xl", // Stronger shadow for floating effect
            "mx-2" // Small margin on sides to not touch screen edges
          )}
        >
            {results.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {results.map((book, index) => {
                  const isAdded = addedBooks.has(book.title)
                  const isFocused = index === focusedIndex
                  const isLoading = addBookMutation.isLoading

                  return (
                    <div
                      key={`${book.title}-${book.author}`}
                      onClick={() => handleBookClick(book)}
                                             className={cn(
                         "p-4 cursor-pointer transition-colors touch-feedback", // Larger padding for mobile with touch feedback
                         "hover:bg-gray-50 active:bg-gray-100", // Active state for mobile
                         isFocused && "bg-gray-50",
                         "border-l-4 border-transparent hover:border-gray-300"
                       )}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Book Cover */}
                        <div className="flex-shrink-0">
                          {book.cover_url ? (
                            <img
                              src={book.cover_url}
                              alt={book.title}
                              className="w-12 h-16 object-cover rounded border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-16 bg-gray-200 rounded border border-gray-200 flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Book Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif font-semibold text-gray-900 text-base leading-snug line-clamp-2">
                            {book.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{book.author}</p>
                          {book.publication_year && (
                            <p className="text-xs text-gray-500 mt-1">{book.publication_year}</p>
                          )}
                        </div>

                        {/* Add Button - Mobile Optimized */}
                        <div className="flex-shrink-0">
                          {session?.user?.id && (
                            <button
                              onClick={(e) => handleAddBook(book, 'want_to_read', e)}
                              disabled={isAdded || isLoading}
                              className={cn(
                                "min-w-[48px] min-h-[48px] rounded-lg flex items-center justify-center", // Touch target
                                "border border-gray-300 transition-all duration-200",
                                isAdded
                                  ? "bg-green-50 border-green-300 text-green-700"
                                  : "bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700",
                                "disabled:opacity-50"
                              )}
                            >
                              {isAdded ? (
                                <Check className="h-5 w-5" />
                              ) : isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Plus className="h-5 w-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : query && !isSearching ? (
              <div className="p-6 text-center text-gray-500">
                <BookOpen className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No books found for "{query}"</p>
                <p className="text-xs mt-1">Try different keywords or check spelling</p>
              </div>
            ) : null}
          </div>
      )}
    </div>
  )
}

export default MobileSearchBar 
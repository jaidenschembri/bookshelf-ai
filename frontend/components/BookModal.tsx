'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, BookOpen, Calendar, Hash, Users, Star, Plus, Check } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Book, bookApi, readingApi } from '@/lib/api'

interface BookModalProps {
  isOpen: boolean
  onClose: () => void
  book: Book | null
  bookId?: number // For cases where we only have an ID and need to fetch details
}

export default function BookModal({ isOpen, onClose, book, bookId }: BookModalProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // Fetch book details if we only have an ID
  const { data: fetchedBook, isLoading: isLoadingBook } = useQuery(
    ['book', bookId],
    () => bookApi.getBook(bookId!),
    {
      enabled: !!bookId && !book,
    }
  )

  // Check if book is in user's library
  const { data: userReadings, isLoading: isLoadingLibrary } = useQuery(
    ['user-readings', session?.user?.id],
    () => session?.user?.id ? readingApi.getUserReadings(parseInt(session.user.id)) : [],
    {
      enabled: !!session?.user?.id && isOpen,
      refetchOnWindowFocus: false,
      retry: 1, // Only retry once to avoid infinite loops
      onError: (error) => {
        console.warn('Failed to load user library:', error)
      }
    }
  )

  const currentBook = book || fetchedBook
  
  // Check if current book is in user's library by comparing book IDs
  const isInLibrary = useMemo(() => {
    if (!currentBook || !userReadings) return false
    
    // Check by book ID if available
    if (currentBook.id) {
      return userReadings.some(reading => reading.book.id === currentBook.id)
    }
    
    // Fallback: check by title + author combination for books from search
    const currentTitle = currentBook.title?.toLowerCase().trim()
    const currentAuthor = currentBook.author?.toLowerCase().trim()
    
    if (!currentTitle || !currentAuthor) return false
    
    return userReadings.some(reading => {
      const readingTitle = reading.book.title?.toLowerCase().trim()
      const readingAuthor = reading.book.author?.toLowerCase().trim()
      return readingTitle === currentTitle && readingAuthor === currentAuthor
    })
  }, [currentBook, userReadings])

  // Add to library mutation
  const addToLibraryMutation = useMutation(
    async () => {
      if (!currentBook) throw new Error('No book selected')
      
      // First add book to database if needed (this handles duplicates)
      const addedBook = await bookApi.add({
        title: currentBook.title,
        author: currentBook.author,
        isbn: currentBook.isbn,
        cover_url: currentBook.cover_url,
        description: currentBook.description,
        publication_year: currentBook.publication_year,
        genre: currentBook.genre,
        total_pages: currentBook.total_pages,
      })

      // Then create reading entry
      await readingApi.create({
        book_id: addedBook.id,
        status: 'want_to_read',
      })

      return addedBook
    },
    {
      onSuccess: () => {
        toast.success(`Added "${currentBook?.title}" to your library!`)
        queryClient.invalidateQueries(['user-readings'])
        queryClient.invalidateQueries(['dashboard'])
        queryClient.invalidateQueries(['readings'])
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to add book to library')
      },
    }
  )

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isLoading = isLoadingBook || isLoadingLibrary
  const canAddToLibrary = session?.user?.id && !isInLibrary && !addToLibraryMutation.isLoading

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-black bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">BOOK DETAILS</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 border-2 border-black bg-white hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="loading-brutalist">
                <div className="w-16 h-16 border-4 border-black bg-white flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-black" />
                </div>
              </div>
              <p className="text-gray-600 mt-4">Loading book details...</p>
            </div>
          ) : !currentBook ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Book not found</h3>
              <p className="text-gray-600">Unable to load book details.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Book Cover and Basic Info */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Cover */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  {currentBook.cover_url ? (
                    <Image
                      src={currentBook.cover_url}
                      alt={currentBook.title}
                      width={200}
                      height={300}
                      className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-cover"
                      style={{ width: '200px', height: 'auto' }}
                    />
                  ) : (
                    <div className="w-48 h-64 bg-gray-200 border-2 border-black flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentBook.title}
                    </h1>
                    <p className="text-lg text-gray-700 mb-4">
                      by {currentBook.author}
                    </p>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentBook.publication_year && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-600">Published: {currentBook.publication_year}</span>
                      </div>
                    )}
                    
                    {currentBook.total_pages && (
                      <div className="flex items-center space-x-2 text-sm">
                        <BookOpen className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-600">{currentBook.total_pages} pages</span>
                      </div>
                    )}
                    
                    {currentBook.isbn && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Hash className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-600">ISBN: {currentBook.isbn}</span>
                      </div>
                    )}
                    
                    {currentBook.genre && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-600">Genre: {currentBook.genre}</span>
                      </div>
                    )}
                  </div>

                  {/* Ratings */}
                  {(currentBook.total_ratings && currentBook.total_ratings > 0) && (
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600">
                        {currentBook.average_rating?.toFixed(1)} ({currentBook.total_ratings} rating{currentBook.total_ratings !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {currentBook.description && (
                <div className="border-t-2 border-black pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">DESCRIPTION</h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <p className="whitespace-pre-line">{currentBook.description}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t-2 border-black pt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  {session?.user?.id ? (
                    isInLibrary ? (
                      <div className="btn-ghost bg-green-50 border-green-600 text-green-800 cursor-default flex items-center space-x-2">
                        <Check className="h-4 w-4" />
                        <span>ADDED TO LIBRARY</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToLibraryMutation.mutate()}
                        disabled={!canAddToLibrary}
                        className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addToLibraryMutation.isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>ADDING...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            <span>ADD TO LIBRARY</span>
                          </>
                        )}
                      </button>
                    )
                  ) : (
                    <div className="text-sm text-gray-600 py-2">
                      Sign in to add books to your library
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
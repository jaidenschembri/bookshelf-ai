'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, BookOpen, Calendar, Hash, Users, Star, Plus, Check, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Book, bookApi, readingApi, Reading } from '@/lib/api'
import { cn } from '@/lib/utils'

interface BookModalProps {
  isOpen: boolean
  onClose: () => void
  book: Book | null
  bookId?: number // For cases where we only have an ID and need to fetch details
  editMode?: 'view' | 'review' // New prop to control what mode we're in
  reading?: Reading // If we have the reading object, we can edit review directly
}

export default function BookModal({ isOpen, onClose, book, bookId, editMode = 'view', reading }: BookModalProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // Review editing state
  const [review, setReview] = useState('')
  const [rating, setRating] = useState(0)
  const [isPublic, setIsPublic] = useState(false)
  const [isEditingReview, setIsEditingReview] = useState(editMode === 'review')

  // Fetch book details if we only have an ID
  const { data: fetchedBook, isLoading: isLoadingBook } = useQuery(
    ['book', bookId],
    () => bookApi.getBook(bookId!),
    {
      enabled: !!bookId && !book,
    }
  )

  // Check if book is in user's library and get reading details
  const { data: userReadings, isLoading: isLoadingLibrary } = useQuery(
    ['user-readings', session?.user?.id],
    () => session?.user?.id ? readingApi.getUserReadings(parseInt(session.user.id)) : [],
    {
      enabled: !!session?.user?.id && isOpen,
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error) => {
        console.warn('Failed to load user library:', error)
      }
    }
  )

  const currentBook = book || fetchedBook
  
  // Find the user's reading for this book
  const userReading = useMemo(() => {
    if (reading) return reading // If reading is passed directly, use it
    if (!currentBook || !userReadings) return null
    
    // Check by book ID if available
    if (currentBook.id) {
      return userReadings.find(r => r.book.id === currentBook.id) || null
    }
    
    // Fallback: check by title + author combination for books from search
    const currentTitle = currentBook.title?.toLowerCase().trim()
    const currentAuthor = currentBook.author?.toLowerCase().trim()
    
    if (!currentTitle || !currentAuthor) return null
    
    return userReadings.find(r => {
      const readingTitle = r.book.title?.toLowerCase().trim()
      const readingAuthor = r.book.author?.toLowerCase().trim()
      return readingTitle === currentTitle && readingAuthor === currentAuthor
    }) || null
  }, [currentBook, userReadings, reading])

  const isInLibrary = !!userReading

  // Initialize review state when we have reading data
  useEffect(() => {
    if (userReading) {
      setReview(userReading.review || '')
      setRating(userReading.rating || 0)
      setIsPublic(userReading.is_review_public || false)
    }
  }, [userReading])

  // Add to library mutation
  const addToLibraryMutation = useMutation(
    async () => {
      if (!currentBook) throw new Error('No book selected')
      
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

  // Update reading/review mutation
  const updateReadingMutation = useMutation(
    async (updates: Partial<Reading>) => {
      if (!userReading) throw new Error('No reading found')
      return readingApi.update(userReading.id, updates)
    },
    {
      onSuccess: () => {
        toast.success('Review updated successfully!')
        queryClient.invalidateQueries(['user-readings'])
        queryClient.invalidateQueries(['dashboard'])
        queryClient.invalidateQueries(['readings'])
        setIsEditingReview(false)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to update review')
      },
    }
  )

  const handleSaveReview = () => {
    updateReadingMutation.mutate({
      review: review.trim() || undefined,
      rating: rating || undefined,
      is_review_public: isPublic
    })
  }

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isEditingReview) {
          setIsEditingReview(false)
        } else {
          onClose()
        }
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
  }, [isOpen, onClose, isEditingReview])

  if (!isOpen) return null

  const isLoading = isLoadingBook && (!book || !currentBook)
  const canAddToLibrary = session?.user?.id && !isInLibrary && !addToLibraryMutation.isLoading

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={() => isEditingReview ? setIsEditingReview(false) : onClose()}
      />
      
      {/* Modal */}
      <div className="relative bg-white border border-gray-200 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-semibold font-serif text-gray-900">
            {isEditingReview ? (userReading?.review ? 'Edit Review' : 'Add Review') : 'Book Details'}
          </h2>
          <button
            onClick={() => isEditingReview ? setIsEditingReview(false) : onClose()}
            className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-900 rounded flex items-center justify-center mx-auto">
                <BookOpen className="h-8 w-8 text-white animate-pulse" />
              </div>
              <p className="text-gray-600 mt-4">Loading book details...</p>
            </div>
          ) : !currentBook ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold font-serif text-gray-900 mb-2">Book not found</h3>
              <p className="text-gray-600">Unable to load book details.</p>
            </div>
          ) : isEditingReview ? (
            // Review editing view
            <div className="space-y-6">
              {/* Book Info Summary */}
              <div className="border border-gray-200 p-4 rounded bg-gray-50">
                <div className="flex items-center space-x-4">
                  {currentBook.cover_url ? (
                    <Image
                      src={currentBook.cover_url}
                      alt={currentBook.title}
                      width={48}
                      height={64}
                      className="object-cover border border-gray-200 rounded"
                      style={{ width: '48px', height: 'auto' }}
                    />
                  ) : (
                    <div className="w-12 h-16 bg-gray-200 border border-gray-200 rounded flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold font-serif text-gray-900">{currentBook.title}</h4>
                    <p className="text-sm text-gray-600">by {currentBook.author}</p>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rating
                </label>
                <div className="flex justify-center sm:justify-start space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={cn(
                        'transition-colors',
                        star <= rating
                          ? 'text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      )}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-gray-600 mt-2">{rating} out of 5 stars</p>
                )}
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Review
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your thoughts about this book..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              {/* Privacy Setting */}
              <div className="border border-gray-200 p-4 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Make Review Public</h4>
                    <p className="text-sm text-gray-600">
                      Other users will be able to see your review and rating
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors',
                      isPublic ? 'bg-gray-900 border-gray-900' : 'bg-gray-200 border-gray-300'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        isPublic ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Review Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsEditingReview(false)}
                  className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReview}
                  disabled={updateReadingMutation.isLoading}
                  className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {updateReadingMutation.isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{userReading?.review ? 'Update Review' : 'Save Review'}</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Book details view
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
                      className="border border-gray-200 rounded shadow-lg object-cover"
                      style={{ width: '200px', height: 'auto' }}
                    />
                  ) : (
                    <div className="w-48 h-64 bg-gray-200 border border-gray-200 rounded flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold font-serif text-gray-900 mb-2">
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
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold font-serif text-gray-900 mb-3">Description</h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <p className="whitespace-pre-line">{currentBook.description}</p>
                  </div>
                </div>
              )}

              {/* User's Review (if exists) */}
              {userReading?.review && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold font-serif text-gray-900">My Review</h3>
                    <button
                      onClick={() => setIsEditingReview(true)}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  
                  {userReading.rating && (
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'h-4 w-4',
                              star <= userReading.rating!
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({userReading.rating}/5)</span>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        {userReading.is_review_public ? (
                          <>
                            <Eye className="h-3 w-3" />
                            <span>Public</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            <span>Private</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-line">{userReading.review}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  {session?.user?.id ? (
                    isLoadingLibrary ? (
                      <button 
                        disabled 
                        className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Checking Library...</span>
                      </button>
                    ) : isInLibrary ? (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded text-sm font-medium cursor-default flex items-center space-x-2">
                          <Check className="h-4 w-4" />
                          <span>In Your Library</span>
                        </div>
                        {userReading && (
                          <button
                            onClick={() => setIsEditingReview(true)}
                            className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors"
                          >
                            {userReading.review ? 'Edit Review' : 'Add Review'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => addToLibraryMutation.mutate()}
                        disabled={!canAddToLibrary}
                        className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {addToLibraryMutation.isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            <span>Add to Library</span>
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
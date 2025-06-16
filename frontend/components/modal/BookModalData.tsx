'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Book, bookApi, readingApi, Reading } from '@/lib/api'

export interface UseBookModalDataProps {
  book: Book | null
  bookId?: number
  reading?: Reading
  isOpen: boolean
  editMode?: 'view' | 'review'
}

export function useBookModalData({ book, bookId, reading, isOpen, editMode = 'view' }: UseBookModalDataProps) {
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

  const handleEditReview = () => {
    setIsEditingReview(true)
  }

  const handleCancelReview = () => {
    setIsEditingReview(false)
    // Reset to original values
    if (userReading) {
      setReview(userReading.review || '')
      setRating(userReading.rating || 0)
      setIsPublic(userReading.is_review_public || false)
    }
  }

  return {
    // Data
    currentBook,
    userReading,
    session,
    isInLibrary,
    
    // Loading states
    isLoadingBook,
    isLoadingLibrary,
    
    // Review state
    review,
    rating,
    isPublic,
    isEditingReview,
    setReview,
    setRating,
    setIsPublic,
    setIsEditingReview,
    
    // Mutations
    addToLibraryMutation,
    updateReadingMutation,
    
    // Handlers
    handleSaveReview,
    handleEditReview,
    handleCancelReview,
  }
} 
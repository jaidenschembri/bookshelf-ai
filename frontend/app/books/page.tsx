'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import { readingApi, Reading } from '@/lib/api'
import { BookOpen, Star, Clock, CheckCircle, Edit3, Trash2, MessageSquare, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useBookModal } from '@/contexts/BookModalContext'
import { 
  Button, 
  Card, 
  Badge, 
  LoadingSpinner,
  Modal,
  Input,
  DetailedBookCard
} from '@/components/ui'
import { cn } from '@/lib/utils'

export default function BooksPage() {
  const { data: session } = useSession()
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [editingReading, setEditingReading] = useState<Reading | null>(null)
  const queryClient = useQueryClient()
  const { openBookModal } = useBookModal()

  const { data: readings, isLoading } = useQuery<Reading[]>(
    ['readings', session?.user?.id, selectedStatus],
    () => readingApi.getUserReadings(
      parseInt(session?.user?.id || '1'), 
      selectedStatus === 'all' ? undefined : selectedStatus
    ),
    {
      enabled: !!session?.user?.id,
      refetchOnWindowFocus: false,
    }
  )

  const updateReadingMutation = useMutation(
    ({ readingId, updates }: { readingId: number; updates: Partial<Reading> }) =>
      readingApi.update(readingId, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['readings'])
        queryClient.invalidateQueries(['dashboard'])
        toast.success('Book updated successfully!')
        setEditingReading(null)
      },
      onError: () => {
        toast.error('Failed to update book')
      },
    }
  )

  const deleteReadingMutation = useMutation(
    (readingId: number) => readingApi.delete(readingId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['readings'])
        queryClient.invalidateQueries(['dashboard'])
        toast.success('Book removed from library')
      },
      onError: () => {
        toast.error('Failed to remove book')
      },
    }
  )

  const handleStatusChange = (reading: Reading, newStatus: string) => {
    updateReadingMutation.mutate({
      readingId: reading.id,
      updates: { status: newStatus as any }
    })
  }

  const handleRatingChange = (reading: Reading, rating: number) => {
    updateReadingMutation.mutate({
      readingId: reading.id,
      updates: { rating }
    })
  }

  const handleProgressUpdate = (reading: Reading, progressPages: number) => {
    updateReadingMutation.mutate({
      readingId: reading.id,
      updates: { progress_pages: progressPages }
    })
  }

  const handleDelete = (readingId: number) => {
    if (confirm('Are you sure you want to remove this book from your library?')) {
      deleteReadingMutation.mutate(readingId)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
        return <CheckCircle className="h-5 w-5 text-black" />
      case 'currently_reading':
        return <Clock className="h-5 w-5 text-black" />
      default:
        return <BookOpen className="h-5 w-5 text-black" />
    }
  }

  const statusOptions = [
    { value: 'all', label: 'All Books' },
    { value: 'want_to_read', label: 'Want to Read' },
    { value: 'currently_reading', label: 'Currently Reading' },
    { value: 'finished', label: 'Finished' },
  ]

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" text="Loading your books..." />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold font-serif tracking-tight mb-2">My Books</h1>
          <p className="text-sm text-gray-600">Manage your personal library and reading progress</p>
        </div>

        {/* Status Filter */}
        <div className="mb-8">
          <div className="flex items-center space-x-8">
            {statusOptions.map((option) => {
              const isActive = selectedStatus === option.value
              const count = readings && option.value !== 'all' 
                ? readings.filter(r => r.status === option.value).length 
                : null
              
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className={`text-sm transition-colors duration-200 focus:outline-none focus:ring-0 active:bg-transparent ${
                    isActive 
                      ? 'text-gray-900 font-semibold' 
                      : 'text-gray-600 hover:text-gray-900 font-medium'
                  }`}
                >
                  {option.label}
                  {count !== null && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({count})
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Books Grid */}
        {readings && readings.length > 0 ? (
          <div className="grid gap-6">
            {readings.map((reading) => (
              <DetailedBookCard
                key={reading.id}
                reading={reading}
                onStatusChange={(status) => handleStatusChange(reading, status)}
                onRatingChange={(rating) => handleRatingChange(reading, rating)}
                onProgressUpdate={(pages) => handleProgressUpdate(reading, pages)}
                onEdit={() => setEditingReading(reading)}
                onDelete={() => handleDelete(reading.id)}
                onBookClick={() => openBookModal(null, reading.book.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold font-serif mb-2">
              {selectedStatus === 'all' ? 'No books in your library' : `No ${selectedStatus.replace('_', ' ')} books`}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Start building your personal library by searching for books.
            </p>
            <a href="/search" className="inline-flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors">
              <span>Search for Books</span>
            </a>
          </div>
        )}
      </div>

      {/* Review Edit Modal */}
      {editingReading && (
        <ReviewEditModal
          reading={editingReading}
          onClose={() => setEditingReading(null)}
          onSave={(updates) => {
            updateReadingMutation.mutate({
              readingId: editingReading.id,
              updates
            })
          }}
        />
      )}
    </Layout>
  )
}

// Review Edit Modal Component
function ReviewEditModal({ 
  reading, 
  onClose, 
  onSave 
}: { 
  reading: Reading
  onClose: () => void
  onSave: (updates: Partial<Reading>) => void
}) {
  const [review, setReview] = useState(reading.review || '')
  const [rating, setRating] = useState(reading.rating || 0)
  const [isPublic, setIsPublic] = useState(reading.is_review_public || false)

  const handleSave = () => {
    onSave({
      review: review.trim() || undefined,
      rating: rating || undefined,
      is_review_public: isPublic
    })
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={reading.review ? 'EDIT REVIEW' : 'ADD REVIEW'}
      size="lg"
            >
      <div className="space-y-6">
            {/* Book Info */}
        <Card variant="flat" padding="md">
          <div className="flex items-center space-x-4">
              {reading.book.cover_url ? (
              <img
                  src={reading.book.cover_url}
                  alt={reading.book.title}
                className="w-12 h-16 object-cover book-cover"
                />
              ) : (
              <div className="w-12 h-16 bg-gray-200 border-4 border-black flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-gray-600" />
                </div>
              )}
              <div>
              <h4 className="heading-sm">{reading.book.title}</h4>
              <p className="text-body text-gray-600">by {reading.book.author}</p>
            </div>
          </div>
        </Card>

            {/* Rating */}
            <div>
          <label className="block text-caption text-gray-600 mb-3">
            RATING
              </label>
              <div className="flex justify-center sm:justify-start space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                className={cn(
                  'transition-colors',
                      star <= rating
                    ? 'text-black'
                    : 'text-gray-300 hover:text-black'
                )}
                  >
                <Star className="h-7 w-7 fill-current" />
                  </button>
                ))}
              </div>
              {rating > 0 && (
            <p className="text-caption text-gray-600 mt-2">{rating} out of 5 stars</p>
              )}
            </div>

            {/* Review Text */}
            <div>
          <label className="block text-caption text-gray-600 mb-3">
            REVIEW
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your thoughts about this book..."
                rows={4}
            className="input-field w-full"
              />
            </div>

            {/* Privacy Setting */}
        <Card variant="flat" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="heading-sm mb-1">MAKE REVIEW PUBLIC</h4>
              <p className="text-caption text-gray-600">
                  Other users will be able to see your review and rating
                </p>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center border-2 border-black transition-colors',
                isPublic ? 'bg-black' : 'bg-white'
              )}
              >
                <span
                className={cn(
                  'inline-block h-4 w-4 transform transition-transform border-2 border-black',
                  isPublic 
                    ? 'translate-x-6 bg-white' 
                    : 'translate-x-1 bg-black'
                )}
                />
              </button>
            </div>
        </Card>
          </div>

          {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
        <Button
          variant="secondary"
              onClick={onClose}
          className="order-2 sm:order-1"
            >
          CANCEL
        </Button>
        <Button
          variant="primary"
              onClick={handleSave}
          className="order-1 sm:order-2"
            >
          {reading.review ? 'UPDATE REVIEW' : 'SAVE REVIEW'}
        </Button>
      </div>
    </Modal>
  )
} 
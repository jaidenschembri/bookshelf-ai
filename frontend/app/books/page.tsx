'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import { readingApi, Reading } from '@/lib/api'
import { BookOpen, Star, Clock, CheckCircle, Edit3, Trash2, MessageSquare, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function BooksPage() {
  const { data: session } = useSession()
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [editingReading, setEditingReading] = useState<Reading | null>(null)
  const queryClient = useQueryClient()

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
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'currently_reading':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <BookOpen className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished':
        return 'bg-green-100 text-green-800'
      case 'currently_reading':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Books</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage your personal library and reading progress</p>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors text-center ${
                  selectedStatus === option.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {option.label}
                {readings && option.value !== 'all' && (
                  <span className="ml-1 sm:ml-2 text-xs">
                    ({readings.filter(r => r.status === option.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        {readings && readings.length > 0 ? (
          <div className="grid gap-6">
            {readings.map((reading) => (
              <div key={reading.id} className="card">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Book Cover */}
                  <div className="flex-shrink-0 mx-auto sm:mx-0">
                    {reading.book.cover_url ? (
                      <Image
                        src={reading.book.cover_url}
                        alt={reading.book.title}
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
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                      <div className="text-center sm:text-left mb-2 sm:mb-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                          {reading.book.title}
                        </h3>
                        <p className="text-gray-600 mb-2">by {reading.book.author}</p>
                        
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-sm text-gray-500 mb-2">
                          {reading.book.genre && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {reading.book.genre}
                            </span>
                          )}
                          {reading.book.publication_year && (
                            <span>{reading.book.publication_year}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-center sm:justify-start space-x-2 sm:mt-1">
                        <button
                          onClick={() => setEditingReading(reading)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(reading.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-center sm:justify-start space-x-3 mb-4">
                      {getStatusIcon(reading.status)}
                      <select
                        value={reading.status}
                        onChange={(e) => handleStatusChange(reading, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 w-full sm:w-auto max-w-xs"
                      >
                        <option value="want_to_read">Want to Read</option>
                        <option value="currently_reading">Currently Reading</option>
                        <option value="finished">Finished</option>
                      </select>
                    </div>

                    {/* Progress Bar (for currently reading) */}
                    {reading.status === 'currently_reading' && reading.total_pages && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>Reading Progress</span>
                          <span>{reading.progress_pages} / {reading.total_pages} pages</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${(reading.progress_pages / reading.total_pages) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <div className="mt-2">
                          <input
                            type="range"
                            min="0"
                            max={reading.total_pages}
                            value={reading.progress_pages}
                            onChange={(e) => handleProgressUpdate(reading, parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* Rating */}
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                      <span className="text-sm text-gray-600 text-center sm:text-left">Rating:</span>
                      <div className="flex justify-center sm:justify-start items-center space-x-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRatingChange(reading, star)}
                            className={`${
                              reading.rating && star <= reading.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            } hover:text-yellow-400 transition-colors`}
                          >
                            <Star className="h-5 w-5 fill-current" />
                          </button>
                        ))}
                      </div>
                      {reading.rating && (
                        <span className="text-sm text-gray-600">({reading.rating}/5)</span>
                      )}
                      </div>
                    </div>

                    {/* Review */}
                    {reading.review ? (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 space-y-2 sm:space-y-0">
                          <h4 className="font-medium text-gray-900 text-center sm:text-left">My Review</h4>
                          <div className="flex items-center justify-center sm:justify-start space-x-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              reading.is_review_public 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {reading.is_review_public ? (
                                <>
                                  <Eye className="h-3 w-3 inline mr-1" />
                                  Public
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3 inline mr-1" />
                                  Private
                                </>
                              )}
                            </span>
                            <button
                              onClick={() => setEditingReading(reading)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 text-center sm:text-left">{reading.review}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingReading(reading)}
                        className="flex items-center justify-center sm:justify-start space-x-2 text-sm text-gray-500 hover:text-gray-700 mb-4 w-full sm:w-auto"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Add a review</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedStatus === 'all' ? 'No books in your library' : `No ${selectedStatus.replace('_', ' ')} books`}
            </h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Start building your personal library by searching for books.
            </p>
            <a href="/search" className="btn-primary w-full sm:w-auto">
              Search for Books
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold">
              {reading.review ? 'Edit Review' : 'Add Review'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Book Info */}
            <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              {reading.book.cover_url ? (
                <Image
                  src={reading.book.cover_url}
                  alt={reading.book.title}
                  width={50}
                  height={70}
                  className="rounded object-cover sm:w-[60px] sm:h-[80px]"
                />
              ) : (
                <div className="w-12 h-16 sm:w-15 sm:h-20 bg-gray-200 rounded flex items-center justify-center">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </div>
              )}
              <div>
                <h4 className="font-medium text-sm sm:text-base">{reading.book.title}</h4>
                <p className="text-xs sm:text-sm text-gray-600">by {reading.book.author}</p>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex justify-center sm:justify-start space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`${
                      star <= rating
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  >
                    <Star className="h-6 w-6 sm:h-7 sm:w-7 fill-current" />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-1 text-center sm:text-left">{rating} out of 5 stars</p>
              )}
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your thoughts about this book..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            {/* Privacy Setting */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
              <div className="text-center sm:text-left">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">Make review public</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Other users will be able to see your review and rating
                </p>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors mx-auto sm:mx-0 ${
                  isPublic ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto order-1 sm:order-2"
            >
              {reading.review ? 'Update Review' : 'Save Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
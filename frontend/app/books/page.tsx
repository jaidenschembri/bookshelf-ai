'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import { readingApi, Reading } from '@/lib/api'
import { BookOpen, Star, Clock, CheckCircle, Edit3, Trash2 } from 'lucide-react'
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
          <h1 className="text-3xl font-bold text-gray-900">My Books</h1>
          <p className="text-gray-600 mt-2">Manage your personal library and reading progress</p>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === option.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {option.label}
                {readings && option.value !== 'all' && (
                  <span className="ml-2 text-xs">
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
                <div className="flex gap-6">
                  {/* Book Cover */}
                  <div className="flex-shrink-0">
                    {reading.book.cover_url ? (
                      <Image
                        src={reading.book.cover_url}
                        alt={reading.book.title}
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
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {reading.book.title}
                        </h3>
                        <p className="text-gray-600 mb-2">by {reading.book.author}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
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
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingReading(reading)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(reading.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center space-x-3 mb-4">
                      {getStatusIcon(reading.status)}
                      <select
                        value={reading.status}
                        onChange={(e) => handleStatusChange(reading, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
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
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-sm text-gray-600">Rating:</span>
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

                    {/* Review */}
                    {reading.review && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{reading.review}</p>
                      </div>
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
            <p className="text-gray-600 mb-6">
              Start building your personal library by searching for books.
            </p>
            <a href="/search" className="btn-primary">
              Search for Books
            </a>
          </div>
        )}
      </div>
    </Layout>
  )
} 
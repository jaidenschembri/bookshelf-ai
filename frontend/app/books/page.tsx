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
  TabNavigation
} from '@/components/ui'
import { BookCard } from '@/components/features'
import { MobileBookList } from '@/components/mobile'
import { cn } from '@/lib/utils'

export default function BooksPage() {
  const { data: session } = useSession()
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const queryClient = useQueryClient()
  const { openBookModal, openReviewModal } = useBookModal()

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
          <TabNavigation
            options={statusOptions.map(option => ({
              ...option,
              count: readings && option.value !== 'all' 
                ? readings.filter(r => r.status === option.value).length 
                : undefined
            }))}
            activeTab={selectedStatus}
            onTabChange={setSelectedStatus}
            spacing="wide"
          />
        </div>

        {/* Books Content */}
        {readings && readings.length > 0 ? (
          <>
            {/* Mobile List View */}
            <div className="block md:hidden">
              <MobileBookList
                readings={readings}
                onBookClick={(book, bookId) => openBookModal(null, bookId)}
                onStatusChange={(reading, status) => handleStatusChange(reading, status)}
                onRatingChange={(reading, rating) => handleRatingChange(reading, rating)}
                onEdit={(reading) => openReviewModal(reading)}
                onDelete={(reading) => handleDelete(reading.id)}
                loading={isLoading}
                emptyMessage={selectedStatus === 'all' ? 'No books in your library' : `No ${selectedStatus.replace('_', ' ')} books`}
              />
            </div>

            {/* Desktop Grid View */}
            <div className="hidden md:block">
              <div className="grid gap-6">
                {readings.map((reading, index) => (
                  <BookCard
                    key={reading.id}
                    book={reading.book}
                    reading={reading}
                    mode="detailed"
                    interactive={true}
                    showControls={true}
                    priority={index < 3} // Priority loading for first 3 books
                    onStatusChange={(status) => handleStatusChange(reading, status)}
                    onRatingChange={(rating) => handleRatingChange(reading, rating)}
                    onProgressUpdate={(pages) => handleProgressUpdate(reading, pages)}
                    onEdit={() => openReviewModal(reading)}
                    onDelete={() => handleDelete(reading.id)}
                    onBookClick={() => openBookModal(null, reading.book.id)}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold font-serif mb-2">
              {selectedStatus === 'all' ? 'No books in your library' : `No ${selectedStatus.replace('_', ' ')} books`}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Start building your personal library by using the search bar above to find books.
            </p>
            <div className="inline-flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm font-medium">
              <span>Use the search bar above to find books</span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
} 
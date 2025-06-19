'use client'

import { Book, Reading } from '@/lib/api'
import { BookDetails, UserReviewDisplay, BookModalActions, ReviewEditor } from '@/components/ui'
import { BookOpen, Clock, CheckCircle } from 'lucide-react'

export interface BookModalContentProps {
  currentBook: Book
  userReading: Reading | null
  isSignedIn: boolean
  isInLibrary: boolean
  isLoadingLibrary: boolean
  canAddToLibrary: boolean
  
  // Review editing props
  review: string
  rating: number
  isPublic: boolean
  isLoadingUpdate: boolean
  
  // Handlers
  onAddToLibrary: () => void
  onReviewChange: (value: string) => void
  onRatingChange: (value: number) => void
  onPublicToggle: (value: boolean) => void
  onSaveReview: () => void
  onCancelReview: () => void
  onStatusChange?: (status: string) => void
}

export function BookModalContent({
  currentBook,
  userReading,
  isSignedIn,
  isInLibrary,
  isLoadingLibrary,
  canAddToLibrary,
  review,
  rating,
  isPublic,
  isLoadingUpdate,
  onAddToLibrary,
  onReviewChange,
  onRatingChange,
  onPublicToggle,
  onSaveReview,
  onCancelReview,
  onStatusChange,
}: BookModalContentProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'currently_reading':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'want_to_read':
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'finished': return 'Finished'
      case 'currently_reading': return 'Currently Reading'
      case 'want_to_read': return 'Want to Read'
      default: return 'Want to Read'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Book Details */}
      <BookDetails book={currentBook} />
      
      {/* Add to Library Section (for users who don't have the book) */}
      {!isInLibrary && (
        <BookModalActions
          isSignedIn={isSignedIn}
          isInLibrary={isInLibrary}
          isLoading={isLoadingLibrary}
          canAddToLibrary={!!canAddToLibrary}
          reading={userReading || undefined}
          onAddToLibrary={onAddToLibrary}
        />
      )}

      {/* Reading Status & Review Section (for users who have the book) */}
      {isInLibrary && isSignedIn && userReading && (
        <div className="border-t border-gray-200 pt-4 sm:pt-6">
          {/* Reading Status */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              Reading Status
            </label>
            <div className="flex items-center space-x-3">
              {getStatusIcon(userReading.status)}
              <select
                value={userReading.status}
                onChange={(e) => onStatusChange?.(e.target.value)}
                disabled={isLoadingUpdate}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="want_to_read">Want to Read</option>
                <option value="currently_reading">Currently Reading</option>
                <option value="finished">Finished</option>
              </select>
            </div>
          </div>

          {/* Review Section */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold font-serif text-gray-900 mb-4">
              Your Review
            </h3>
            
            {/* Show review editor directly */}
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <ReviewEditor
                book={currentBook}
                reading={userReading || undefined}
                review={review}
                rating={rating}
                isPublic={isPublic}
                isLoading={isLoadingUpdate}
                onReviewChange={onReviewChange}
                onRatingChange={onRatingChange}
                onPublicToggle={onPublicToggle}
                onSave={onSaveReview}
                onCancel={onCancelReview}
                compact={true} // New prop to make it more compact for inline use
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
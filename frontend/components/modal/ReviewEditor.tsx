import React from 'react'
import { Book, Reading } from '@/lib/api'
import { StarRating, BookCover, ToggleSwitch, Button } from '@/components/ui'

export interface ReviewEditorProps {
  book: Book
  reading?: Reading
  review: string
  rating: number
  isPublic: boolean
  isLoading: boolean
  onReviewChange: (review: string) => void
  onRatingChange: (rating: number) => void
  onPublicToggle: (isPublic: boolean) => void
  onSave: () => void
  onCancel: () => void
  compact?: boolean
}

const ReviewEditor: React.FC<ReviewEditorProps> = ({
  book,
  reading,
  review,
  rating,
  isPublic,
  isLoading,
  onReviewChange,
  onRatingChange,
  onPublicToggle,
  onSave,
  onCancel,
  compact = false
}) => {
  return (
    <div className={`space-y-4 ${compact ? 'sm:space-y-4' : 'sm:space-y-6'}`}>
      {/* Book Info Summary - Only show in full mode */}
      {!compact && (
        <div className="border border-gray-200 p-3 sm:p-4 rounded bg-gray-50">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <BookCover
              src={book.cover_url}
              alt={book.title}
              size="sm"
              className="flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold font-serif text-gray-900 text-sm sm:text-base truncate">{book.title}</h4>
              <p className="text-xs sm:text-sm text-gray-600 truncate">by {book.author}</p>
            </div>
          </div>
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
          Rating
        </label>
        <div className="flex justify-center sm:justify-start">
          <StarRating
            rating={rating}
            onRatingChange={onRatingChange}
            size="lg"
            showLabel
          />
        </div>
      </div>

      {/* Review Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
          Review
        </label>
        <textarea
          value={review}
          onChange={(e) => onReviewChange(e.target.value)}
          placeholder="Share your thoughts about this book..."
          rows={compact ? 3 : 4}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Privacy Setting */}
      {!compact && (
        <div className="border border-gray-200 p-3 sm:p-4 rounded">
          <ToggleSwitch
            checked={isPublic}
            onChange={onPublicToggle}
            label="Make Review Public"
            description="Other users will be able to see your review and rating"
          />
        </div>
      )}

      {/* Privacy Setting - Compact version */}
      {compact && (
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Make review public</span>
          </div>
          <ToggleSwitch
            checked={isPublic}
            onChange={onPublicToggle}
            size="sm"
          />
        </div>
      )}

      {/* Actions */}
      <div className={`flex flex-col sm:flex-row justify-end gap-3 ${compact ? 'pt-2' : 'pt-3 sm:pt-4 border-t border-gray-200'}`}>
        {!compact && (
          <Button
            variant="secondary"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}
        <Button
          variant="primary"
          onClick={onSave}
          loading={isLoading}
          className="w-full sm:w-auto"
        >
          {reading?.review ? 'Update Review' : 'Save Review'}
        </Button>
      </div>
    </div>
  )
}

export default ReviewEditor 
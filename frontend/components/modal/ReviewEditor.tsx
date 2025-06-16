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
  onCancel
}) => {
  return (
    <div className="space-y-6">
      {/* Book Info Summary */}
      <div className="border border-gray-200 p-4 rounded bg-gray-50">
        <div className="flex items-center space-x-4">
          <BookCover
            src={book.cover_url}
            alt={book.title}
            size="sm"
          />
          <div>
            <h4 className="font-semibold font-serif text-gray-900">{book.title}</h4>
            <p className="text-sm text-gray-600">by {book.author}</p>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
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
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Review
        </label>
        <textarea
          value={review}
          onChange={(e) => onReviewChange(e.target.value)}
          placeholder="Share your thoughts about this book..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
        />
      </div>

      {/* Privacy Setting */}
      <div className="border border-gray-200 p-4 rounded">
        <ToggleSwitch
          checked={isPublic}
          onChange={onPublicToggle}
          label="Make Review Public"
          description="Other users will be able to see your review and rating"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          loading={isLoading}
        >
          {reading?.review ? 'Update Review' : 'Save Review'}
        </Button>
      </div>
    </div>
  )
}

export default ReviewEditor 
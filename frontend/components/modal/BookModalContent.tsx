'use client'

import { Book, Reading } from '@/lib/api'
import { BookDetails, UserReviewDisplay, BookModalActions, ReviewEditor } from '@/components/ui'

export interface BookModalContentProps {
  currentBook: Book
  userReading: Reading | null
  isEditingReview: boolean
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
  onEditReview: () => void
  onAddToLibrary: () => void
  onReviewChange: (value: string) => void
  onRatingChange: (value: number) => void
  onPublicToggle: (value: boolean) => void
  onSaveReview: () => void
  onCancelReview: () => void
}

export function BookModalContent({
  currentBook,
  userReading,
  isEditingReview,
  isSignedIn,
  isInLibrary,
  isLoadingLibrary,
  canAddToLibrary,
  review,
  rating,
  isPublic,
  isLoadingUpdate,
  onEditReview,
  onAddToLibrary,
  onReviewChange,
  onRatingChange,
  onPublicToggle,
  onSaveReview,
  onCancelReview,
}: BookModalContentProps) {
  if (isEditingReview) {
    return (
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
      />
    )
  }

  return (
    <div className="space-y-6">
      <BookDetails book={currentBook} />
      
      {userReading && (
        <UserReviewDisplay 
          reading={userReading} 
          onEditClick={onEditReview} 
        />
      )}
      
      <BookModalActions
        isSignedIn={isSignedIn}
        isInLibrary={isInLibrary}
        isLoading={isLoadingLibrary}
        canAddToLibrary={canAddToLibrary}
        reading={userReading || undefined}
        onAddToLibrary={onAddToLibrary}
        onEditReview={onEditReview}
      />
    </div>
  )
} 
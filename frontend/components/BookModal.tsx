'use client'

import { Book, Reading } from '@/lib/api'
import { 
  Modal, 
  useBookModalData, 
  BookModalStates, 
  BookModalContent, 
  useModalKeyboard 
} from '@/components/ui'

interface BookModalProps {
  isOpen: boolean
  onClose: () => void
  book: Book | null
  bookId?: number // For cases where we only have an ID and need to fetch details
  editMode?: 'view' | 'review' // New prop to control what mode we're in
  reading?: Reading // If we have the reading object, we can edit review directly
}

export default function BookModal({ isOpen, onClose, book, bookId, editMode = 'view', reading }: BookModalProps) {
  // Use the custom hook for all data management
  const {
    currentBook,
    userReading,
    session,
    isInLibrary,
    isLoadingBook,
    isLoadingLibrary,
    review,
    rating,
    isPublic,
    isEditingReview,
    setReview,
    setRating,
    setIsPublic,
    setIsEditingReview,
    addToLibraryMutation,
    updateReadingMutation,
    handleSaveReview,
    handleEditReview,
    handleCancelReview,
  } = useBookModalData({ book, bookId, reading, isOpen, editMode })

  // Use the keyboard hook for modal controls
  const { handleModalClose } = useModalKeyboard({
    isOpen,
    isEditingReview,
    onClose,
    setIsEditingReview
  })

  if (!isOpen) return null

  const isLoading = isLoadingBook && (!book || !currentBook)
  const canAddToLibrary = session?.user?.id && !isInLibrary && !addToLibraryMutation.isLoading

  const modalTitle = isEditingReview 
    ? (userReading?.review ? 'Edit Review' : 'Add Review') 
    : 'Book Details'

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={modalTitle}
      size="lg"
    >
      <BookModalStates
        isLoading={isLoading}
        currentBook={currentBook}
      />
      
      {currentBook && (
        <BookModalContent
          currentBook={currentBook}
          userReading={userReading}
          isEditingReview={isEditingReview}
          isSignedIn={!!session?.user?.id}
          isInLibrary={isInLibrary}
          isLoadingLibrary={isLoadingLibrary}
          canAddToLibrary={!!canAddToLibrary}
          review={review}
          rating={rating}
          isPublic={isPublic}
          isLoadingUpdate={updateReadingMutation.isLoading}
          onEditReview={handleEditReview}
          onAddToLibrary={() => addToLibraryMutation.mutate()}
          onReviewChange={setReview}
          onRatingChange={setRating}
          onPublicToggle={setIsPublic}
          onSaveReview={handleSaveReview}
          onCancelReview={handleCancelReview}
        />
      )}
    </Modal>
  )
} 
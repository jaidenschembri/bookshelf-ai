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
  reading?: Reading // If we have the reading object, we can edit review directly
}

export default function BookModal({ isOpen, onClose, book, bookId, reading }: BookModalProps) {
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
    setReview,
    setRating,
    setIsPublic,
    addToLibraryMutation,
    updateReadingMutation,
    handleSaveReview,
    handleCancelReview,
    handleStatusChange,
  } = useBookModalData({ book, bookId, reading, isOpen })

  // Use the keyboard hook for modal controls
  const { handleModalClose } = useModalKeyboard({
    isOpen,
    onClose
  })

  if (!isOpen) return null

  const isLoading = isLoadingBook && (!book || !currentBook)
  const canAddToLibrary = session?.user?.id && !isInLibrary && !addToLibraryMutation.isLoading

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Book Details"
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
          isSignedIn={!!session?.user?.id}
          isInLibrary={isInLibrary}
          isLoadingLibrary={isLoadingLibrary}
          canAddToLibrary={!!canAddToLibrary}
          review={review}
          rating={rating}
          isPublic={isPublic}
          isLoadingUpdate={updateReadingMutation.isLoading}
          onAddToLibrary={() => addToLibraryMutation.mutate()}
          onReviewChange={setReview}
          onRatingChange={setRating}
          onPublicToggle={setIsPublic}
          onSaveReview={handleSaveReview}
          onCancelReview={handleCancelReview}
          onStatusChange={handleStatusChange}
        />
      )}
    </Modal>
  )
} 
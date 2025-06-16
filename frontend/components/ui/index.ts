// ============================================================================
// BOOKSHELF AI UI COMPONENT LIBRARY
// ============================================================================
// Barrel exports for all UI components with comprehensive type definitions

// Base UI Components
export { default as Button } from './Button'
export { default as Card } from './Card'
export { default as Input } from './Input'
export { default as Badge } from './Badge'
export { default as Modal } from './Modal'
export { default as LoadingSpinner } from './LoadingSpinner'
export { default as TabNavigation } from './TabNavigation'

// New Reusable Components
export { default as StarRating } from './StarRating'
export { default as BookCover } from './BookCover'
export { default as ToggleSwitch } from './ToggleSwitch'

// Modal Components
export { default as BookMetadata } from '../modal/BookMetadata'
export { default as ReviewEditor } from '../modal/ReviewEditor'
export { default as BookDetails } from '../modal/BookDetails'
export { default as UserReviewDisplay } from '../modal/UserReviewDisplay'
export { default as BookModalActions } from '../modal/BookModalActions'

// Modal Support Components
export { useBookModalData } from '../modal/BookModalData'
export { BookModalStates, BookModalLoading, BookModalError } from '../modal/BookModalStates'
export { BookModalContent } from '../modal/BookModalContent'
export { useModalKeyboard } from '../modal/useModalKeyboard'

// Feature Components (Book-related)
export { default as BookCard } from '../features/BookCard'
export { default as StatCard } from '../features/StatCard'
export { default as ProgressCard } from '../features/ProgressCard'
export { default as RecommendationCard } from '../features/RecommendationCard'

export { SearchBookCard } from '../features/SearchBookCard'

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Design System Types
export type {
  BaseComponentProps,
  ComponentStates,
  ColorVariant,
  TextSize,
  FontWeight,
  SpacingSize,
  BorderRadius
} from '@/types/ui'

// Component-specific Types (from design system)
export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  CardProps,
  CardVariant,
  CardPadding,
  InputProps,
  InputVariant,
  BadgeProps,
  BadgeVariant,
  BadgeSize,
  BadgeColor,
  ModalProps,
  ModalSize,
  TabNavigationProps,
  TabOption,
  LoadingSpinnerProps,
  LoadingSize
} from '@/types/ui'

// New Component Types
export type { StarRatingProps } from './StarRating'
export type { BookCoverProps } from './BookCover'
export type { ToggleSwitchProps } from './ToggleSwitch'

// Modal Component Types
export type { BookMetadataProps } from '../modal/BookMetadata'
export type { ReviewEditorProps } from '../modal/ReviewEditor'
export type { BookDetailsProps } from '../modal/BookDetails'
export type { UserReviewDisplayProps } from '../modal/UserReviewDisplay'
export type { BookModalActionsProps } from '../modal/BookModalActions'

// Modal Support Component Types
export type { UseBookModalDataProps } from '../modal/BookModalData'
export type { BookModalStatesProps, BookModalLoadingProps, BookModalErrorProps } from '../modal/BookModalStates'
export type { BookModalContentProps } from '../modal/BookModalContent'
export type { UseModalKeyboardProps } from '../modal/useModalKeyboard'

// Feature Component Types (from individual files)
export type { BookCardProps } from '../features/BookCard'
export type { StatCardProps } from '../features/StatCard'
export type { ProgressCardProps } from '../features/ProgressCard'
export type { RecommendationCardProps } from '../features/RecommendationCard'


// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
IMPORT PATTERNS:

// Individual components
import { Button, Card, Input, StarRating, BookCover } from '@/components/ui'

// Modal components
import { ReviewEditor, BookDetails, UserReviewDisplay, BookModalActions } from '@/components/ui'

// With types
import { Button, type ButtonProps, StarRating, type StarRatingProps } from '@/components/ui'

COMPONENT USAGE:

✅ Correct Usage:
<ReviewEditor
  book={book}
  reading={reading}
  review={review}
  rating={rating}
  isPublic={isPublic}
  isLoading={isLoading}
  onReviewChange={setReview}
  onRatingChange={setRating}
  onPublicToggle={setIsPublic}
  onSave={handleSave}
  onCancel={handleCancel}
/>

<BookDetails book={book} />

<UserReviewDisplay reading={reading} onEditClick={handleEdit} />

<BookModalActions
  isSignedIn={!!session}
  isInLibrary={isInLibrary}
  isLoading={isLoadingLibrary}
  canAddToLibrary={canAddToLibrary}
  reading={reading}
  onAddToLibrary={handleAddToLibrary}
  onEditReview={handleEditReview}
/>

❌ Common Mistakes:
<Card padding="xl"> // Build error - 'xl' not valid
<Badge variant="default"> // Build error - 'default' not valid
<StarRating rating="high"> // Type error - rating must be number
*/ 
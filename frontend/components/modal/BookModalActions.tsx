import React from 'react'
import { Reading } from '@/lib/api'
import { Button, LoadingSpinner } from '@/components/ui'
import { Plus, Check } from 'lucide-react'

export interface BookModalActionsProps {
  isSignedIn: boolean
  isInLibrary: boolean
  isLoading: boolean
  canAddToLibrary: boolean
  reading?: Reading
  onAddToLibrary: () => void
  onEditReview: () => void
  className?: string
}

const BookModalActions: React.FC<BookModalActionsProps> = ({
  isSignedIn,
  isInLibrary,
  isLoading,
  canAddToLibrary,
  reading,
  onAddToLibrary,
  onEditReview,
  className
}) => {
  return (
    <div className={className}>
      <div className="border-t border-gray-200 pt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {isSignedIn ? (
            isLoading ? (
              <Button 
                disabled 
                variant="primary"
                className="flex items-center space-x-2"
              >
                <LoadingSpinner size="sm" />
                <span>Checking Library...</span>
              </Button>
            ) : isInLibrary ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded text-sm font-medium cursor-default flex items-center space-x-2">
                  <Check className="h-4 w-4" />
                  <span>In Your Library</span>
                </div>
                {reading && (
                  <Button
                    variant="primary"
                    onClick={onEditReview}
                  >
                    {reading.review ? 'Edit Review' : 'Add Review'}
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={onAddToLibrary}
                disabled={!canAddToLibrary}
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
              >
                Add to Library
              </Button>
            )
          ) : (
            <div className="text-sm text-gray-600 py-2">
              Sign in to add books to your library
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookModalActions 
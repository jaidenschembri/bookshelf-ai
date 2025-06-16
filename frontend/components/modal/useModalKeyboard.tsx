'use client'

import { useEffect } from 'react'

export interface UseModalKeyboardProps {
  isOpen: boolean
  isEditingReview: boolean
  onClose: () => void
  setIsEditingReview: (value: boolean) => void
}

export function useModalKeyboard({ 
  isOpen, 
  isEditingReview, 
  onClose, 
  setIsEditingReview 
}: UseModalKeyboardProps) {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isEditingReview) {
          setIsEditingReview(false)
        } else {
          onClose()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, isEditingReview, setIsEditingReview])

  const handleModalClose = () => {
    if (isEditingReview) {
      setIsEditingReview(false)
    } else {
      onClose()
    }
  }

  return {
    handleModalClose
  }
} 
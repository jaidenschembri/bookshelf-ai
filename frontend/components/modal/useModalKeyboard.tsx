'use client'

import { useEffect } from 'react'

interface UseModalKeyboardProps {
  isOpen: boolean
  onClose: () => void
}

export function useModalKeyboard({ isOpen, onClose }: UseModalKeyboardProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleModalClose = () => {
    onClose()
  }

  return {
    handleModalClose
  }
} 
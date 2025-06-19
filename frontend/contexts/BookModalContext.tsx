'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Book, Reading } from '@/lib/api'
import BookModal from '@/components/BookModal'

interface BookModalContextType {
  openBookModal: (book: Book | null, bookId?: number) => void
  openReviewModal: (reading: Reading) => void
  closeBookModal: () => void
  isOpen: boolean
}

const BookModalContext = createContext<BookModalContextType | undefined>(undefined)

export const useBookModal = () => {
  const context = useContext(BookModalContext)
  if (!context) {
    throw new Error('useBookModal must be used within a BookModalProvider')
  }
  return context
}

interface BookModalProviderProps {
  children: ReactNode
}

export const BookModalProvider = ({ children }: BookModalProviderProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentBook, setCurrentBook] = useState<Book | null>(null)
  const [currentBookId, setCurrentBookId] = useState<number | undefined>(undefined)
  const [currentReading, setCurrentReading] = useState<Reading | undefined>(undefined)

  const openBookModal = (book: Book | null, bookId?: number) => {
    setCurrentBook(book)
    setCurrentBookId(bookId)
    setCurrentReading(undefined)
    setIsOpen(true)
  }

  const openReviewModal = (reading: Reading) => {
    setCurrentBook(reading.book)
    setCurrentBookId(reading.book.id)
    setCurrentReading(reading)
    setIsOpen(true)
  }

  const closeBookModal = () => {
    setIsOpen(false)
    setCurrentBook(null)
    setCurrentBookId(undefined)
    setCurrentReading(undefined)
  }

  return (
    <BookModalContext.Provider value={{ openBookModal, openReviewModal, closeBookModal, isOpen }}>
      {children}
      <BookModal
        isOpen={isOpen}
        onClose={closeBookModal}
        book={currentBook}
        bookId={currentBookId}
        reading={currentReading}
      />
    </BookModalContext.Provider>
  )
} 
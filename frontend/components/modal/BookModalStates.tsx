'use client'

import { BookOpen } from 'lucide-react'
import { Book } from '@/lib/api'

export interface BookModalLoadingProps {
  message?: string
}

export function BookModalLoading({ message = 'Loading book details...' }: BookModalLoadingProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-900 rounded flex items-center justify-center mx-auto">
        <BookOpen className="h-8 w-8 text-white animate-pulse" />
      </div>
      <p className="text-gray-600 mt-4">{message}</p>
    </div>
  )
}

export interface BookModalErrorProps {
  title?: string
  message?: string
}

export function BookModalError({ 
  title = 'Book not found', 
  message = 'Unable to load book details.' 
}: BookModalErrorProps) {
  return (
    <div className="text-center py-12">
      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold font-serif text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{message}</p>
    </div>
  )
}

export interface BookModalStatesProps {
  isLoading: boolean
  currentBook: Book | null | undefined
  loadingMessage?: string
  errorTitle?: string
  errorMessage?: string
}

export function BookModalStates({ 
  isLoading, 
  currentBook, 
  loadingMessage,
  errorTitle,
  errorMessage 
}: BookModalStatesProps) {
  if (isLoading) {
    return <BookModalLoading message={loadingMessage} />
  }

  if (!currentBook) {
    return <BookModalError title={errorTitle} message={errorMessage} />
  }

  return null
} 
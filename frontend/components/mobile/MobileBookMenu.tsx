import React, { useState, useRef, useEffect } from 'react'
import { 
  MoreVertical, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Star, 
  Edit3, 
  Trash2, 
  BarChart3 
} from 'lucide-react'
import { Reading } from '@/lib/api'
import { Badge, Button } from '@/components/ui'

export interface MobileBookMenuProps {
  reading: Reading
  isOpen: boolean
  onClose: () => void
  onStatusChange: (status: string) => void
  onRatingChange: (rating: number) => void
  onEdit: () => void
  onDelete: () => void
}

const MobileBookMenu: React.FC<MobileBookMenuProps> = ({
  reading,
  isOpen,
  onClose,
  onStatusChange,
  onRatingChange,
  onEdit,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const statusOptions = [
    { value: 'want_to_read', label: 'Want to Read', icon: BookOpen, color: 'gray' as const },
    { value: 'currently_reading', label: 'Currently Reading', icon: Clock, color: 'blue' as const },
    { value: 'finished', label: 'Finished', icon: CheckCircle, color: 'green' as const },
  ]

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black bg-opacity-25" onClick={onClose} />
      
      {/* Menu */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={menuRef}
          className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Book Options</h3>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{reading.book.title}</p>
          </div>

          <div className="p-4 space-y-6">
            {/* Status Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Reading Status</h4>
              <div className="space-y-2">
                {statusOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = reading.status === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => onStatusChange(option.value)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isSelected 
                          ? 'bg-gray-50 border-gray-300' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">{option.label}</span>
                      </div>
                      {isSelected && (
                        <Badge variant="status" size="sm" color={option.color}>
                          Current
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Rating Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Rating</h4>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => onRatingChange(star)}
                    className="p-1"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        reading.rating && reading.rating >= star
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    />
                  </button>
                ))}
                {reading.rating && (
                  <button
                    onClick={() => onRatingChange(0)}
                    className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              {reading.rating && (
                <p className="text-sm text-gray-600 mt-1">
                  Rated {reading.rating} out of 5 stars
                </p>
              )}
            </div>

            {/* Actions Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onEdit()
                    onClose()
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <Edit3 className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Edit Review</span>
                </button>
                
                <button
                  onClick={() => {
                    onDelete()
                    onClose()
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="font-medium">Remove from Library</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MobileBookMenu 
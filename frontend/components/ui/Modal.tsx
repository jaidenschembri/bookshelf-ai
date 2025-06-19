import React, { useEffect, useRef } from 'react'
import { BaseComponentProps } from '@/types/ui'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Button } from '@/components/ui'

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  overlay?: boolean
  footer?: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({
  children,
  isOpen,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  overlay = true,
  footer,
  className,
  ...props
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }
  
  const modalClasses = cn(
    // Base modal styles
    'bg-white border border-gray-200 rounded-lg shadow-lg w-full relative z-10',
    // Mobile responsive: full screen on very small screens, with margins on larger screens
    'mx-2 sm:mx-4',
    // Max height and overflow handling
    'max-h-[95vh] sm:max-h-[90vh] flex flex-col',
    // Size classes (only apply on larger screens)
    `sm:${sizeClasses[size]}`,
    className
  )
  
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      {overlay && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
      )}
      
      <div
        ref={modalRef}
        className={modalClasses}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900 pr-4">{title}</h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                icon={<X className="h-4 w-4" />}
                className="ml-auto flex-shrink-0"
              />
            )}
          </div>
        )}
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal 
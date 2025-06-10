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
    'bg-white border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full mx-4',
    sizeClasses[size],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {overlay && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
      )}
      
      <div
        ref={modalRef}
        className={cn(modalClasses, 'relative z-10')}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b-4 border-black">
            {title && (
              <h2 className="heading-sm text-black">{title}</h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                icon={<X className="h-4 w-4" />}
                className="ml-auto"
              />
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="p-6 border-t-4 border-black">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal 
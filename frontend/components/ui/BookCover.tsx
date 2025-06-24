import React, { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BookCoverProps {
  src?: string | null
  alt: string
  width?: number
  height?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  rounded?: boolean
  shadow?: boolean
  lazy?: boolean
  priority?: boolean
}

const BookCover: React.FC<BookCoverProps> = ({
  src,
  alt,
  width,
  height,
  size = 'md',
  className,
  rounded = true,
  shadow = false,
  lazy = true,
  priority = false
}) => {
  const [hasError, setHasError] = useState(false)

  // Size presets
  const sizePresets = {
    sm: { width: 48, height: 64, iconSize: 'h-5 w-5' },
    md: { width: 96, height: 128, iconSize: 'h-8 w-8' },
    lg: { width: 160, height: 240, iconSize: 'h-12 w-12' },
    xl: { width: 200, height: 300, iconSize: 'h-16 w-16' }
  }

  const preset = sizePresets[size]
  const finalWidth = width || preset.width
  const finalHeight = height || preset.height

  const containerClasses = cn(
    'border border-gray-200 flex items-center justify-center overflow-hidden relative',
    rounded && 'rounded',
    shadow && 'shadow-lg',
    className
  )

  // Show fallback if no src or error occurred
  if (!src || hasError) {
    return (
      <div 
        className={cn(containerClasses, 'bg-gray-200')}
        style={{ width: finalWidth, height: finalHeight }}
      >
        <BookOpen className={cn('text-gray-400', preset.iconSize)} />
      </div>
    )
  }

  // Show image
  return (
    <div className={containerClasses} style={{ width: finalWidth, height: finalHeight }}>
      <img
        src={src}
        alt={alt}
        width={finalWidth}
        height={finalHeight}
        className="w-full h-full object-cover"
        loading={lazy && !priority ? 'lazy' : 'eager'}
        onError={() => setHasError(true)}
      />
    </div>
  )
}

export default BookCover 
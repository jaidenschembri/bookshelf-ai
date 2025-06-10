// Base UI component prop interfaces
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// Button variants and sizes
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

// Card variants
export type CardVariant = 'default' | 'flat' | 'hover' | 'compact' | 'featured'

// Input variants
export type InputVariant = 'default' | 'large' | 'error' | 'success'

// Badge variants
export type BadgeVariant = 'status' | 'rating' | 'genre' | 'count'

// Common component states
export interface ComponentStates {
  loading?: boolean
  disabled?: boolean
  error?: boolean
  success?: boolean
} 
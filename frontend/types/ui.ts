// ============================================================================
// BOOKSHELF AI DESIGN SYSTEM
// ============================================================================
// A comprehensive type-safe design system for consistent UI components

// Base UI component prop interfaces
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// Common component states
export interface ComponentStates {
  loading?: boolean
  disabled?: boolean
  error?: boolean
  success?: boolean
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

// Color Palette
export type ColorVariant = 
  | 'primary'      // Gray-900 (main actions)
  | 'secondary'    // Gray-50 (subtle backgrounds)
  | 'success'      // Green-600 (positive actions)
  | 'danger'       // Red-600 (destructive actions)
  | 'warning'      // Yellow-600 (cautions)
  | 'info'         // Blue-600 (informational)

// Typography Scale
export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold'

// Spacing Scale
export type SpacingSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// Border Radius
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'full'

// ============================================================================
// COMPONENT-SPECIFIC TYPES
// ============================================================================

// Button Component Types
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends BaseComponentProps, ComponentStates {
  variant?: ButtonVariant
  size?: ButtonSize
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

// Card Component Types
export type CardVariant = 'default' | 'flat' | 'hover' | 'compact' | 'featured'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends BaseComponentProps {
  variant?: CardVariant
  header?: React.ReactNode
  footer?: React.ReactNode
  padding?: CardPadding  // Note: 'xl' removed - causes build errors
  clickable?: boolean
  onClick?: () => void
}

// Input Component Types
export type InputVariant = 'default' | 'large' | 'error' | 'success'

export interface InputProps extends BaseComponentProps, ComponentStates {
  variant?: InputVariant
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url'
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  label?: string
  helperText?: string
  errorMessage?: string
  required?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

// Badge Component Types
export type BadgeVariant = 'status' | 'rating' | 'genre' | 'count'  // Note: NO 'default' - causes build errors
export type BadgeSize = 'sm' | 'md' | 'lg'
export type BadgeColor = 'black' | 'red' | 'green' | 'blue' | 'yellow' | 'gray'

export interface BadgeProps extends BaseComponentProps {
  variant?: BadgeVariant
  size?: BadgeSize
  color?: BadgeColor
  icon?: React.ReactNode
  count?: number
  rating?: number
}

// Modal Component Types
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: ModalSize
  showCloseButton?: boolean
  overlay?: boolean
  footer?: React.ReactNode
}

// Tab Navigation Types
export interface TabOption {
  id: string
  label: string
  count?: number
}

export interface TabNavigationProps extends BaseComponentProps {
  tabs: TabOption[]
  activeTab: string
  onTabChange: (tabId: string) => void
  variant?: 'default' | 'pills'
}

// Loading Spinner Types
export type LoadingSize = 'sm' | 'md' | 'lg'

export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: LoadingSize
  text?: string
}

// ============================================================================
// DESIGN SYSTEM GUIDELINES
// ============================================================================

/*
BUTTON USAGE:
✅ <Button variant="primary" size="md">Save</Button>
✅ <Button variant="secondary" onClick={handleClick}>Cancel</Button>
✅ <Button variant="danger" loading={isDeleting}>Delete</Button>

CARD USAGE:
✅ <Card variant="hover" padding="md">Content</Card>
✅ <Card variant="featured" padding="lg">Featured content</Card>
❌ <Card padding="xl"> // Will cause build error

BADGE USAGE:
✅ <Badge variant="genre" size="sm">Fiction</Badge>
✅ <Badge variant="rating" rating={4} size="md" />
❌ <Badge variant="default"> // Will cause build error

COMMON MISTAKES TO AVOID:
- Using invalid variant values not defined in types
- Missing required props on components
- Inconsistent prop naming (e.g., onClick vs onBookClick for specific components)
*/

// ============================================================================
// FEATURE COMPONENT TYPES
// ============================================================================

// Book-related component props are defined in their respective files
// This ensures type safety while keeping feature logic separate from design system 
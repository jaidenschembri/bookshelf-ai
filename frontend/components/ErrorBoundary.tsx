'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui'
import { logError, classifyError } from '@/lib/error-handling'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorId: null 
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error using our centralized error handling
    const appError = classifyError({
      ...error,
      componentStack: errorInfo.componentStack,
    })
    
    logError(appError, {
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorId: null 
    })
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-semibold font-serif tracking-tight mb-4">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. This has been logged and our team will investigate.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-gray-50 p-4 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Error ID:</strong> {this.state.errorId}
                  </div>
                  <div className="mb-2">
                    <strong>Message:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                variant="primary"
                icon={<RefreshCw className="h-4 w-4" />}
              >
                Try Again
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                variant="secondary"
                icon={<Home className="h-4 w-4" />}
              >
                Go Home
              </Button>
            </div>
            
            {this.state.errorId && (
              <p className="text-xs text-gray-400 mt-4">
                Error ID: {this.state.errorId}
              </p>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Specialized error boundaries for different contexts
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Page-level error handling
        console.error('Page Error Boundary caught an error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ 
  children, 
  componentName 
}: { 
  children: ReactNode
  componentName?: string 
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-red-200 bg-red-50 rounded">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {componentName ? `${componentName} Error` : 'Component Error'}
            </span>
          </div>
          <p className="text-xs text-red-600 mt-1">
            This component encountered an error and couldn't render properly.
          </p>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error(`Component Error (${componentName}):`, error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
} 
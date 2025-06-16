// Centralized Error Handling for Frontend
import { AxiosError } from 'axios'
import toast from 'react-hot-toast'

// Error Types
export interface AppError {
  code: string
  message: string
  userMessage: string
  statusCode?: number
  context?: Record<string, any>
  timestamp: Date
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// Error Categories
export const ERROR_CODES = {
  // Network Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // Authentication Errors
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Business Logic Errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Client Errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  COMPONENT_ERROR: 'COMPONENT_ERROR',
} as const

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'The request took too long. Please try again.',
  [ERROR_CODES.SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
  [ERROR_CODES.AUTH_EXPIRED]: 'Your session has expired. Please sign in again.',
  [ERROR_CODES.AUTH_INVALID]: 'Authentication failed. Please sign in again.',
  [ERROR_CODES.AUTH_REQUIRED]: 'Please sign in to continue.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ERROR_CODES.INVALID_INPUT]: 'The information provided is not valid.',
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 'The requested item could not be found.',
  [ERROR_CODES.PERMISSION_DENIED]: 'You don\'t have permission to perform this action.',
  [ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  [ERROR_CODES.COMPONENT_ERROR]: 'Something went wrong. Please refresh the page.',
}

// Error Classification
export function classifyError(error: any): AppError {
  const timestamp = new Date()
  
  // Handle Axios errors (API calls)
  if (error?.isAxiosError || error?.response) {
    const axiosError = error as AxiosError
    const status = axiosError.response?.status
    const data = axiosError.response?.data as any
    
    switch (status) {
      case 401:
        return {
          code: ERROR_CODES.AUTH_EXPIRED,
          message: data?.detail || 'Authentication failed',
          userMessage: ERROR_MESSAGES[ERROR_CODES.AUTH_EXPIRED],
          statusCode: status,
          timestamp,
        }
      
      case 403:
        return {
          code: ERROR_CODES.PERMISSION_DENIED,
          message: data?.detail || 'Permission denied',
          userMessage: ERROR_MESSAGES[ERROR_CODES.PERMISSION_DENIED],
          statusCode: status,
          timestamp,
        }
      
      case 404:
        return {
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          message: data?.detail || 'Resource not found',
          userMessage: ERROR_MESSAGES[ERROR_CODES.RESOURCE_NOT_FOUND],
          statusCode: status,
          timestamp,
        }
      
      case 400:
        return {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: data?.detail || 'Validation error',
          userMessage: data?.detail || ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
          statusCode: status,
          timestamp,
        }
      
      case 429:
        return {
          code: ERROR_CODES.RATE_LIMITED,
          message: data?.detail || 'Rate limited',
          userMessage: ERROR_MESSAGES[ERROR_CODES.RATE_LIMITED],
          statusCode: status,
          timestamp,
        }
      
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          code: ERROR_CODES.SERVER_ERROR,
          message: data?.detail || 'Server error',
          userMessage: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
          statusCode: status,
          timestamp,
        }
      
      default:
        if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
          return {
            code: ERROR_CODES.TIMEOUT_ERROR,
            message: 'Request timeout',
            userMessage: ERROR_MESSAGES[ERROR_CODES.TIMEOUT_ERROR],
            timestamp,
          }
        }
        
        if (axiosError.code === 'ERR_NETWORK' || !navigator.onLine) {
          return {
            code: ERROR_CODES.NETWORK_ERROR,
            message: 'Network error',
            userMessage: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
            timestamp,
          }
        }
    }
  }
  
  // Handle React component errors
  if (error?.componentStack) {
    return {
      code: ERROR_CODES.COMPONENT_ERROR,
      message: error.message || 'Component error',
      userMessage: ERROR_MESSAGES[ERROR_CODES.COMPONENT_ERROR],
      context: { componentStack: error.componentStack },
      timestamp,
    }
  }
  
  // Handle generic JavaScript errors
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: error?.message || String(error),
    userMessage: ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
    timestamp,
  }
}

// Error Severity Assessment
export function getErrorSeverity(error: AppError): ErrorSeverity {
  switch (error.code) {
    case ERROR_CODES.SERVER_ERROR:
    case ERROR_CODES.COMPONENT_ERROR:
      return 'critical'
    
    case ERROR_CODES.AUTH_EXPIRED:
    case ERROR_CODES.AUTH_INVALID:
    case ERROR_CODES.PERMISSION_DENIED:
      return 'high'
    
    case ERROR_CODES.NETWORK_ERROR:
    case ERROR_CODES.TIMEOUT_ERROR:
    case ERROR_CODES.RESOURCE_NOT_FOUND:
      return 'medium'
    
    default:
      return 'low'
  }
}

// Error Logging
export function logError(error: AppError, context?: Record<string, any>) {
  const severity = getErrorSeverity(error)
  const logData = {
    ...error,
    severity,
    context: { ...error.context, ...context },
    userAgent: navigator.userAgent,
    url: window.location.href,
  }
  
  // Console logging with appropriate level
  switch (severity) {
    case 'critical':
      console.error('🚨 CRITICAL ERROR:', logData)
      break
    case 'high':
      console.error('❌ HIGH SEVERITY ERROR:', logData)
      break
    case 'medium':
      console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData)
      break
    default:
      console.info('ℹ️ LOW SEVERITY ERROR:', logData)
  }
  
  // In production, you would send this to your error tracking service
  // Example: Sentry, LogRocket, Bugsnag, etc.
  if (process.env.NODE_ENV === 'production') {
    // sendToErrorTrackingService(logData)
  }
}

// Error Handler Hook
export function useErrorHandler() {
  return (error: any, context?: Record<string, any>) => {
    const appError = classifyError(error)
    logError(appError, context)
    
    // Show user-friendly toast notification
    const severity = getErrorSeverity(appError)
    switch (severity) {
      case 'critical':
        toast.error(appError.userMessage, { duration: 8000 })
        break
      case 'high':
        toast.error(appError.userMessage, { duration: 6000 })
        break
      case 'medium':
        toast.error(appError.userMessage, { duration: 4000 })
        break
      default:
        toast.error(appError.userMessage, { duration: 3000 })
    }
    
    return appError
  }
}

// Async Error Handler for API calls
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Record<string, any>
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args)
    } catch (error) {
      const appError = classifyError(error)
      logError(appError, { ...context, functionName: fn.name, args })
      
      // Don't show toast for auth errors - let the component handle it
      if (appError.code !== ERROR_CODES.AUTH_EXPIRED && appError.code !== ERROR_CODES.AUTH_INVALID) {
        toast.error(appError.userMessage)
      }
      
      return null
    }
  }
}

// Error Recovery Utilities
export const errorRecovery = {
  // Retry with exponential backoff
  async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T | null> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        if (attempt === maxAttempts) {
          const appError = classifyError(error)
          logError(appError, { retryAttempts: maxAttempts })
          toast.error(`Failed after ${maxAttempts} attempts: ${appError.userMessage}`)
          return null
        }
        
        // Wait before retrying (exponential backoff)
        const delay = baseDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    return null
  },
  
  // Fallback data provider
  withFallback<T>(data: T | null | undefined, fallback: T): T {
    return data ?? fallback
  },
} 
import { useSession } from 'next-auth/react'
import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'

export function useAuthRefresh() {
  const { data: session, status } = useSession()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false)

  useEffect(() => {
    // Only attempt refresh once per session
    if (
      session?.user && 
      !session?.accessToken && 
      status === 'authenticated' && 
      !isRefreshing && 
      !hasAttemptedRefresh
    ) {
      console.log('User missing JWT token, attempting to refresh session...')
      setIsRefreshing(true)
      setHasAttemptedRefresh(true)
      
      signIn('google', { redirect: false })
        .then(() => {
          console.log('Authentication refresh completed')
        })
        .catch((error) => {
          console.error('Authentication refresh failed:', error)
        })
        .finally(() => {
          setIsRefreshing(false)
        })
    }
  }, [session, status, isRefreshing, hasAttemptedRefresh])

  return {
    needsAuth: !!(session?.user && !session?.accessToken),
    isRefreshing,
    hasValidAuth: !!(session?.user && session?.accessToken),
    session,
    status
  }
}

export function clearAuthErrorFlag() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_error_logged')
  }
} 
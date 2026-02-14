'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500" />
          <p className="ml-3 text-lg">Loading...</p>
        </div>
      </main>
    )
  }

  if (user) {
    return null
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-muted-foreground text-center max-w-sm">
          Use your Google account to sign in and manage your prompts.
        </p>
        <Button size="lg" onClick={signInWithGoogle}>
          Sign in with Google
        </Button>
      </div>
    </main>
  )
}

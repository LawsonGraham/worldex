import { signIn } from "next-auth/react"
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"

export default function Login() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (router.query.error) {
      setError(router.query.error as string)
    }
  }, [router.query])

  const handleSignIn = async () => {
    try {
      // bypassed given vercel is down
      router.push('/')
      // await signIn("worldcoin", { 
      //   callbackUrl: "/",
      // })
    } catch (error) {
      console.error('Sign in error:', error)
      setError(error instanceof Error ? error.message : 'Failed to sign in')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card max-w-md w-full space-y-8">
        <div className="card-header text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome to WorlDEX
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in with World ID to continue
          </p>
        </div>

        <div className="card-content space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-md p-4">
              <p className="text-sm text-destructive">
                Error: {error}
              </p>
            </div>
          )}

          <Button
            onClick={handleSignIn}
            className="w-full"
            size="lg"
          >
            <span className="mr-2">
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            Sign in with World ID
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">
                Secure authentication powered by World ID
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Make sure you have the World App installed and are verified
          </p>
        </div>
      </div>
    </div>
  )
}

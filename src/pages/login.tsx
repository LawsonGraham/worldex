import { signIn } from "next-auth/react"
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

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
      await signIn("worldcoin", { 
        callbackUrl: "/",
      })
    } catch (error) {
      console.error('Sign in error:', error)
      setError(error instanceof Error ? error.message : 'Failed to sign in')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">
            Welcome to WorldEx
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign in with World ID to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-md p-4 mt-4">
            <p className="text-sm text-red-400">
              Error: {error}
            </p>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={handleSignIn}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-blue-500 group-hover:text-blue-400"
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
          </button>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">
                Secure authentication powered by World ID
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Make sure you have the World App installed and are verified
          </p>
        </div>
      </div>
    </div>
  )
}

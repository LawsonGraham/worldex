import { useSession } from 'next-auth/react'

export function WorldIDStatus() {
  const { data: session } = useSession()

  return (
    <div className="card bg-white/5 p-6 rounded-lg">
      <div className="card-header mb-4">
        <h2 className="card-title text-xl font-bold">World ID Status</h2>
      </div>
      <div className="card-content">
        <p className="text-gray-400">
          Verification Level:{' '}
          <span className="text-white">
            {session?.user?.verificationLevel || 'Not Verified'}
          </span>
        </p>
        {session?.user?.name && (
          <div className="text-gray-400 mt-2">
            <span className="block">User ID:</span>
            <span className="text-white break-all">
              {session.user.name}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

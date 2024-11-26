import { ConnectKitButton } from 'connectkit'
import { useAccount, useBalance, type BaseError } from 'wagmi'
import { formatEther } from 'viem'
import { useSession, signOut } from 'next-auth/react'
import ContractAbi from '../abi/ContractAbi.json'

export default function Home() {
  const { data: session } = useSession()
  const account = useAccount()
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: account.address,
  })

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">WorldEx</h1>
          <div className="flex items-center space-x-4">
            <ConnectKitButton />
            {session && (
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>

        {account.isConnected && (
          <div className="space-y-8">
            {/* World ID Verification Status */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">World ID Status</h2>
              <div className="space-y-2">
                <p className="text-gray-300">
                  Verification Level:{' '}
                  <span className="text-green-400">
                    {session?.user?.verificationLevel || 'Not Verified'}
                  </span>
                </p>
                {session?.user?.name && (
                  <p className="text-gray-300">
                    User ID: <span className="text-blue-400">{session.user.name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Wallet Info Card */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Wallet Information</h2>
              <div className="space-y-2">
                <p className="text-gray-300">
                  Address: <span className="text-blue-400">{account.address}</span>
                </p>
                <p className="text-gray-300">
                  Balance:{' '}
                  {isBalanceLoading ? (
                    <span className="text-yellow-400">Loading...</span>
                  ) : balance ? (
                    <span className="text-green-400">
                      {formatEther(balance.value)} {balance.symbol}
                    </span>
                  ) : (
                    <span className="text-red-400">Error loading balance</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {!account.isConnected && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Welcome to WorldEx</h2>
            <p className="text-gray-400 mb-8">
              Connect your wallet and verify with World ID to get started
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

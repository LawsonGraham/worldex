import abi from '../abi/ContractAbi.json'
import { ConnectKitButton } from 'connectkit'
import { IDKitWidget, ISuccessResult, useIDKit } from '@worldcoin/idkit'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, type BaseError } from 'wagmi'
import { decodeAbiParameters, parseAbiParameters, formatEther } from 'viem'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import WorldID components with SSR disabled
const DynamicIDKitWidget = dynamic(
  () => import('@worldcoin/idkit').then(mod => mod.IDKitWidget),
  { ssr: false }
)

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [done, setDone] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const { setOpen } = useIDKit()

  const account = useAccount()
  const { data: hash, isPending, error, writeContractAsync } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({
      hash,
    })

  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: account.address,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration errors by only rendering when mounted
  if (!mounted) return null

  const submitTx = async (proof: ISuccessResult) => {
    try {
      setVerificationError(null)
      console.log('Starting verification with proof:', {
        merkle_root: proof.merkle_root,
        nullifier_hash: proof.nullifier_hash,
        proof: proof.proof,
        signal: account.address
      })
      
      const decodedProof = decodeAbiParameters(
        parseAbiParameters('uint256[8]'),
        proof.proof as `0x${string}`
      )[0]
      
      console.log('Contract details:', {
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        app_id: process.env.NEXT_PUBLIC_APP_ID,
        action: process.env.NEXT_PUBLIC_ACTION
      })

      console.log('Calling verifyAndExecute with args:', {
        signal: account.address,
        root: proof.merkle_root,
        nullifierHash: proof.nullifier_hash,
        decodedProof
      })

      await writeContractAsync({
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        account: account.address!,
        abi,
        functionName: 'verifyAndExecute',
        args: [
          account.address!,
          BigInt(proof.merkle_root),
          BigInt(proof.nullifier_hash),
          decodedProof,
        ],
      })
      setDone(true)
    } catch (error) {
      console.error('Verification error details:', error)
      setVerificationError(
        error instanceof Error 
          ? error.message 
          : (error as BaseError).shortMessage || 'Verification failed'
      )
      setDone(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">WorldEx</h1>
          <ConnectKitButton />
        </div>

        {account.isConnected && (
          <div className="space-y-8">
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

            {/* World ID Verification Card */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">World ID Verification</h2>
              <div className="space-y-4">
                <DynamicIDKitWidget
                  app_id={process.env.NEXT_PUBLIC_APP_ID as `app_${string}`}
                  action={process.env.NEXT_PUBLIC_ACTION as string}
                  signal={account.address}
                  onSuccess={submitTx}
                  autoClose
                />

                {!done && (
                  <button 
                    onClick={() => setOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    {!hash && (isPending ? "Pending, please check your wallet..." : "Verify with World ID")}
                  </button>
                )}

                {/* Error Display */}
                {verificationError && (
                  <div className="bg-red-900/50 border border-red-500 rounded p-3 mt-4">
                    <p className="text-red-400">{verificationError}</p>
                  </div>
                )}

                {/* Transaction Status */}
                <div className="space-y-2">
                  {hash && (
                    <p className="text-gray-300">
                      Transaction Hash: <span className="text-blue-400">{hash}</span>
                    </p>
                  )}
                  {isPending && (
                    <p className="text-yellow-400">
                      Pending, please check your wallet...
                    </p>
                  )}
                  {isConfirming && <p className="text-yellow-400">Waiting for confirmation...</p>}
                  {isConfirmed && <p className="text-green-400">Transaction confirmed!</p>}
                  {error && (
                    <p className="text-red-400">
                      Error: {(error as BaseError).shortMessage || error.toString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!account.isConnected && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Welcome to WorldEx</h2>
            <p className="text-gray-400 mb-8">Connect your wallet to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

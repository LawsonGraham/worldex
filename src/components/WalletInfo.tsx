import { useAccount, useBalance } from 'wagmi'
import { formatEther } from 'viem'
import { sepolia } from 'wagmi/chains'

export function WalletInfo() {
  const account = useAccount()
  
  // Balance hook for WorldChain Sepolia
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: account.address,
    chainId: sepolia.id,
    query: {
      refetchInterval: 1000,
      enabled: !!account.address,
    }
  })

  return (
    <div className="card bg-white/5 p-6 rounded-lg">
      <div className="card-header mb-4">
        <h2 className="card-title text-xl font-bold">Wallet Information</h2>
      </div>
      <div className="card-content space-y-3">
        <p className="text-gray-400">
          Network: <span className="text-white">WorldChain Sepolia</span>
        </p>
        <div className="text-gray-400">
          <span className="block">Address:</span>
          <span className="text-white break-all">
            {account.address}
          </span>
        </div>
        <p className="text-gray-400">
          Balance:{' '}
          {isBalanceLoading ? (
            <span className="text-yellow-400">Loading...</span>
          ) : balance ? (
            <span className="text-emerald-400">
              {formatEther(balance.value)} SepoliaETH
            </span>
          ) : account.address ? (
            <span className="text-red-400">Error loading balance</span>
          ) : (
            <span className="text-gray-400">Connect wallet to view balance</span>
          )}
        </p>
        <p className="text-sm text-gray-400 mt-4">
          Make sure you're connected to WorldChain Sepolia network
        </p>
      </div>
    </div>
  )
}

import { useAccount, useChainId } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { Button } from './ui/button'

export function NetworkCheck() {
  const chainId = useChainId()
  const { isConnected } = useAccount()
  const isWrongNetwork = chainId !== sepolia.id

  if (!isConnected) return null
  if (!isWrongNetwork) return null

  return (
    <div className="bg-yellow-500/10 text-yellow-400 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-2">Wrong Network</h3>
      <p>Please switch to WorldChain Sepolia testnet in your wallet to use the exchange.</p>
      <p className="mt-4 text-sm">
        Available trading pairs:
      </p>
      <ul className="list-disc list-inside mt-1 ml-2 text-sm">
        <li>SepoliaETH/BTC</li>
        <li>SepoliaETH/USDC</li>
        <li>BTC/USDC</li>
      </ul>
      <div className="mt-4 text-sm">
        <p>How to add WorldChain Sepolia to MetaMask:</p>
        <ol className="list-decimal list-inside mt-1 ml-2">
          <li>Open MetaMask</li>
          <li>Click the network dropdown at the top</li>
          <li>Select "Add network"</li>
          <li>Add manually using these details:</li>
          <ul className="list-disc list-inside mt-1 ml-4 text-xs">
            <li>Network Name: WorldChain Sepolia</li>
            <li>RPC URL: https://worldchain-sepolia.g.alchemy.com</li>
            <li>Chain ID: {sepolia.id}</li>
            <li>Currency Symbol: SepoliaETH</li>
          </ul>
        </ol>
      </div>
    </div>
  )
}

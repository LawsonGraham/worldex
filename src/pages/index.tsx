import { useEffect, useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { useAccount } from 'wagmi'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { Button } from '../components/ui/button'
import { WorldIDStatus } from '../components/WorldIDStatus'
import { WalletInfo } from '../components/WalletInfo'
import { DepositForm } from '../components/DepositForm'
import { SwapForm } from '../components/SwapForm'
import { NetworkCheck } from '../components/NetworkCheck'

type Operation = 'swap' | 'deposit' | 'withdraw' | 'limit-order' | 'market-order' | 'order-book'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const account = useAccount()
  const [selectedOperation, setSelectedOperation] = useState<Operation>('swap')

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const renderOperationButton = (
    operation: Operation,
    title: string,
    description: string
  ) => (
    <Button
      onClick={() => setSelectedOperation(operation)}
      variant={selectedOperation === operation ? 'default' : 'secondary'}
      className="h-auto p-4 w-full"
    >
      <div className="flex flex-col items-start">
        <span className="text-lg mb-1">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
    </Button>
  )

  const renderOperationContent = () => {
    switch (selectedOperation) {
      case 'swap':
        return <SwapForm />
      case 'deposit':
        return <DepositForm />
      case 'withdraw':
        return <div className="text-center p-8 text-gray-400">Withdraw functionality coming soon</div>
      case 'limit-order':
        return <div className="text-center p-8 text-gray-400">Limit orders coming soon</div>
      case 'market-order':
        return <div className="text-center p-8 text-gray-400">Market orders coming soon</div>
      case 'order-book':
        return <div className="text-center p-8 text-gray-400">Order book coming soon</div>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="container">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">WorldEx</h1>
          <div className="flex items-center space-x-4">
            <ConnectKitButton />
            {session && (
              <Button
                onClick={() => signOut()}
                variant="destructive"
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>

        {/* Network Check */}
        <NetworkCheck />

        {!account.isConnected && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Welcome to WorldEx</h2>
            <p className="text-gray-400 mb-8">
              Connect your wallet to start trading
            </p>
          </div>
        )}

        {account.isConnected && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Account Info */}
            <div className="lg:col-span-1 space-y-6">
              <WorldIDStatus />
              <WalletInfo />
            </div>

            {/* Right Column - Operations */}
            <div className="lg:col-span-3 space-y-6">
              {/* Operation Selection */}
              <div className="card bg-white/5 p-6 rounded-lg">
                <div className="card-header mb-4">
                  <h2 className="card-title text-xl font-bold">Available Operations</h2>
                </div>
                <div className="card-content">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {renderOperationButton('swap', 'Swap', 'Swap tokens instantly')}
                    {renderOperationButton('deposit', 'Deposit', 'Deposit ETH')}
                    {renderOperationButton('withdraw', 'Withdraw', 'Withdraw ETH')}
                    {renderOperationButton('limit-order', 'Limit', 'Place a limit order')}
                    {renderOperationButton('market-order', 'Market', 'Place a market order')}
                    {renderOperationButton('order-book', 'Orders', 'View order book')}
                  </div>
                </div>
              </div>

              {/* Operation Content */}
              {renderOperationContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

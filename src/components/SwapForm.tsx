import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useChainId } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { Button } from './ui/button'
import { sepolia } from 'wagmi/chains'
import ContractAbi from '../abi/ContractAbi.json'

enum Side {
  BUY = 'BUY',
  SELL = 'SELL'
}

interface Order {
  id: bigint
  orderType: string
  trader: string
  side: Side
  ticker: string
  amount: bigint
  amountFilled: bigint
  price: bigint
}

// Updated token list
const SUPPORTED_TOKENS = [
  { symbol: 'SepoliaETH', address: '0x0000000000000000000000000000000000000000' },
  { symbol: 'BTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
  { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }
]

export function SwapForm() {
  const account = useAccount()
  const chainId = useChainId()
  const [swapFromToken, setSwapFromToken] = useState(SUPPORTED_TOKENS[0])
  const [swapToToken, setSwapToToken] = useState(SUPPORTED_TOKENS[1])
  const [swapAmount, setSwapAmount] = useState('')
  const [estimatedOutput, setEstimatedOutput] = useState('0')
  const [priceImpact, setPriceImpact] = useState('0')
  const [swapLoading, setSwapLoading] = useState(false)
  const [swapError, setSwapError] = useState<string | null>(null)

  const { writeContract } = useWriteContract()

  const { data: fromTokenSellOrders } = useReadContract({
    abi: ContractAbi,
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    functionName: 'getOrderBook',
    args: [swapFromToken.address as `0x${string}`, Side.SELL],
    query: {
      refetchInterval: 1000,
      enabled: !!account.address && chainId === sepolia.id,
    }
  }) as { data: Order[] | undefined }

  const { data: toTokenBuyOrders } = useReadContract({
    abi: ContractAbi,
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    functionName: 'getOrderBook',
    args: [swapToToken.address as `0x${string}`, Side.BUY],
    query: {
      refetchInterval: 1000,
      enabled: !!account.address && chainId === sepolia.id,
    }
  }) as { data: Order[] | undefined }

  const calculateSwapDetails = () => {
    if (!swapAmount || !swapFromToken || !swapToToken || !fromTokenSellOrders || !toTokenBuyOrders) {
      setEstimatedOutput('0')
      setPriceImpact('0')
      return
    }

    try {
      if (fromTokenSellOrders.length > 0 && toTokenBuyOrders.length > 0) {
        const inputPrice = parseFloat(formatEther(fromTokenSellOrders[0].price))
        const outputPrice = parseFloat(formatEther(toTokenBuyOrders[0].price))
        
        const inputAmount = parseFloat(swapAmount)
        const estimatedAmount = (inputAmount * inputPrice) / outputPrice
        setEstimatedOutput(estimatedAmount.toFixed(6))

        const impact = Math.abs((outputPrice - inputPrice) / inputPrice * 100)
        setPriceImpact(impact.toFixed(2))
      }
    } catch (error) {
      console.error('Error calculating swap details:', error)
      setEstimatedOutput('0')
      setPriceImpact('0')
    }
  }

  useEffect(() => {
    calculateSwapDetails()
  }, [swapFromToken, swapToToken, swapAmount, fromTokenSellOrders, toTokenBuyOrders])

  const handleSwap = async () => {
    if (!account.address || !swapAmount || !swapFromToken || !swapToToken) return
    if (chainId !== sepolia.id) {
      setSwapError('Please switch to WorldChain Sepolia network')
      return
    }
    
    setSwapLoading(true)
    setSwapError(null)

    try {
      if (swapFromToken.symbol === 'SepoliaETH') {
        console.log('Depositing SepoliaETH first...')
        await writeContract({
          abi: ContractAbi,
          address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
          functionName: 'depositEth',
          value: parseEther(swapAmount),
        })
      }

      console.log('Creating sell order...')
      await writeContract({
        abi: ContractAbi,
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'createMarketOrder',
        args: [
          Side.SELL,
          swapFromToken.address as `0x${string}`,
          parseEther(swapAmount)
        ],
      })

      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log('Creating buy order...')
      await writeContract({
        abi: ContractAbi,
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'createMarketOrder',
        args: [
          Side.BUY,
          swapToToken.address as `0x${string}`,
          parseEther(estimatedOutput)
        ],
      })

      setSwapAmount('')
      setEstimatedOutput('0')
      setPriceImpact('0')
    } catch (error: any) {
      console.error('Error executing swap:', error)
      setSwapError(error?.message || 'Error executing swap')
    } finally {
      setSwapLoading(false)
    }
  }

  const handleSwitchTokens = () => {
    const fromToken = swapFromToken
    setSwapFromToken(swapToToken)
    setSwapToToken(fromToken)
    setSwapAmount('')
    setEstimatedOutput('0')
    setPriceImpact('0')
  }

  return (
    <div className="max-w-md mx-auto bg-white/5 p-6 rounded-lg backdrop-blur-sm">
      <div className="space-y-4">
        {/* From Token */}
        <div>
          <label className="block text-sm font-medium mb-2">You Pay</label>
          <div className="flex gap-4">
            <select
              className="flex-1 bg-white/10 rounded p-2"
              value={swapFromToken.symbol}
              onChange={(e) => setSwapFromToken(
                SUPPORTED_TOKENS.find(t => t.symbol === e.target.value) || SUPPORTED_TOKENS[0]
              )}
            >
              {SUPPORTED_TOKENS.map(token => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="flex-1 bg-white/10 rounded p-2"
              placeholder="0.0"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="rounded-full p-2"
            onClick={handleSwitchTokens}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </Button>
        </div>

        {/* To Token */}
        <div>
          <label className="block text-sm font-medium mb-2">You Receive</label>
          <div className="flex gap-4">
            <select
              className="flex-1 bg-white/10 rounded p-2"
              value={swapToToken.symbol}
              onChange={(e) => setSwapToToken(
                SUPPORTED_TOKENS.find(t => t.symbol === e.target.value) || SUPPORTED_TOKENS[1]
              )}
            >
              {SUPPORTED_TOKENS.map(token => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
            <div className="flex-1 bg-white/10 rounded p-2 flex items-center">
              {estimatedOutput}
            </div>
          </div>
        </div>

        {/* Swap Details */}
        {estimatedOutput !== '0' && (
          <div className="bg-white/5 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Rate</span>
              <span>1 {swapFromToken.symbol} = {(parseFloat(estimatedOutput) / parseFloat(swapAmount)).toFixed(6)} {swapToToken.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Price Impact</span>
              <span className={`${parseFloat(priceImpact) > 5 ? 'text-red-400' : 'text-green-400'}`}>
                {priceImpact}%
              </span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {swapError && (
          <div className="bg-red-500/10 text-red-400 rounded-lg p-4 text-sm">
            {swapError}
          </div>
        )}

        {/* Swap Button */}
        <Button
          className="w-full"
          onClick={handleSwap}
          disabled={swapLoading || !swapAmount || parseFloat(swapAmount) <= 0 || chainId !== sepolia.id}
        >
          {swapLoading ? 'Swapping...' : chainId !== sepolia.id ? 'Wrong Network' : 'Swap'}
        </Button>

        {/* SepoliaETH Deposit Note */}
        {swapFromToken.symbol === 'SepoliaETH' && (
          <p className="text-sm text-gray-400">
            Note: This will require two transactions - first to deposit SepoliaETH, then to execute the swap.
          </p>
        )}

        {/* Network Note */}
        <div className="text-sm text-gray-400">
          <p>Trading on WorldChain Sepolia testnet</p>
          <p>Available pairs: SepoliaETH/BTC, SepoliaETH/USDC, BTC/USDC</p>
        </div>
      </div>
    </div>
  )
}

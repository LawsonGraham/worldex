import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useChainId } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { Button } from './ui/button'
import { sepolia } from 'wagmi/chains'
import ContractAbi from '../abi/ContractAbi.json'

export function DepositForm() {
  const account = useAccount()
  const chainId = useChainId()
  const [amount, setAmount] = useState('')
  const [depositError, setDepositError] = useState<string | null>(null)
  const [depositLoading, setDepositLoading] = useState(false)

  const { writeContract } = useWriteContract()

  // Contract balance with polling
  const { data: contractBalance } = useReadContract({
    abi: ContractAbi,
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    functionName: 'getEthBalance',
    query: {
      refetchInterval: 1000,
      enabled: !!account.address && chainId === sepolia.id,
    }
  }) as { data: bigint | undefined }

  const handleDeposit = async () => {
    if (!account.address || !amount) return
    if (chainId !== sepolia.id) {
      setDepositError('Please switch to WorldChain Sepolia network')
      return
    }

    setDepositLoading(true)
    setDepositError(null)

    try {
      console.log('Depositing SepoliaETH:', amount)
      const tx = await writeContract({
        abi: ContractAbi,
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'depositEth',
        value: parseEther(amount),
      })
      console.log('Deposit transaction:', tx)
      setAmount('') // Reset amount after successful deposit
    } catch (error: any) {
      console.error('Error depositing SepoliaETH:', error)
      setDepositError(error?.message || 'Error depositing SepoliaETH')
    } finally {
      setDepositLoading(false)
    }
  }

  return (
    <div className="card bg-white/5 p-6 rounded-lg">
      <div className="card-header mb-4">
        <h3 className="card-title text-xl font-bold">Deposit SepoliaETH</h3>
      </div>
      <div className="card-content space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <input
            type="number"
            className="w-full p-2 bg-white/10 rounded"
            placeholder="Amount in SepoliaETH"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setDepositError(null) // Clear error when input changes
            }}
          />
        </div>

        {depositError && (
          <div className="bg-red-500/10 text-red-400 rounded-lg p-4 text-sm">
            {depositError}
          </div>
        )}

        <Button
          onClick={handleDeposit}
          disabled={depositLoading || !amount || parseFloat(amount) <= 0 || chainId !== sepolia.id}
          className="w-full"
        >
          {depositLoading ? 'Depositing...' : 'Deposit SepoliaETH'}
        </Button>

        <div className="text-sm text-gray-400">
          <p>Contract Balance: {contractBalance ? formatEther(contractBalance) : '...'} SepoliaETH</p>
          <p className="mt-2">Note: Make sure you have enough SepoliaETH in your wallet.</p>
        </div>
      </div>
    </div>
  )
}

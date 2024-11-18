import abi from '../abi/ContractAbi.json'
import { ConnectKitButton } from 'connectkit'
import { IDKitWidget, ISuccessResult, useIDKit } from '@worldcoin/idkit'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, type BaseError } from 'wagmi'
import { decodeAbiParameters, parseAbiParameters, formatEther } from 'viem'
import { useState } from 'react'

export default function Home() {
	const account = useAccount()
	const { setOpen } = useIDKit()
	const [done, setDone] = useState(false)
	const { data: hash, isPending, error, writeContractAsync } = useWriteContract()
	const { isLoading: isConfirming, isSuccess: isConfirmed } = 
		useWaitForTransactionReceipt({
			hash,
		})

	const { data: balance } = useBalance({
		address: account.address,
	})

	const submitTx = async (proof: ISuccessResult) => {
		try {
			await writeContractAsync({
				address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
				account: account.address!,
				abi,
				functionName: 'verifyAndExecute',
				args: [
					account.address!,
					BigInt(proof!.merkle_root),
					BigInt(proof!.nullifier_hash),
					decodeAbiParameters(
						parseAbiParameters('uint256[8]'),
						proof!.proof as `0x${string}`
					)[0],
				],
			})
			setDone(true)
		} catch (error) {throw new Error((error as BaseError).shortMessage)}
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
									Balance: <span className="text-green-400">{balance ? `${formatEther(balance.value)} ${balance.symbol}` : 'Loading...'}</span>
								</p>
							</div>
						</div>

						{/* World ID Verification Card */}
						<div className="bg-gray-800 rounded-lg p-6 shadow-lg">
							<h2 className="text-xl font-semibold mb-4">World ID Verification</h2>
							<div className="space-y-4">
								<IDKitWidget
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
										{!hash && (isPending ? "Pending, please check your wallet..." : "Verify and Execute Transaction")}
									</button>
								)}

								{/* Transaction Status */}
								<div className="space-y-2">
									{hash && (
										<p className="text-gray-300">
											Transaction Hash: <span className="text-blue-400">{hash}</span>
										</p>
									)}
									{isConfirming && <p className="text-yellow-400">Waiting for confirmation...</p>}
									{isConfirmed && <p className="text-green-400">Transaction confirmed.</p>}
									{error && (
										<p className="text-red-400">
											Error: {(error as BaseError).message}
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

import { createConfig, http } from 'wagmi'
import { sepolia, Chain } from 'wagmi/chains'
import { getDefaultConfig } from 'connectkit'

const ALCHEMY_RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || 'https://worldchain-sepolia.g.alchemy.com/v2/dHgmedS39psbe_tuXLRsdUSupfWi85Rj'

// Define WorldChain Sepolia as a custom chain
const worldChainSepolia: Chain = {
  ...sepolia,
  id: sepolia.id,
  name: 'WorldChain Sepolia',
  nativeCurrency: {
    name: 'WorldChain Sepolia ETH',
    symbol: 'SepoliaETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [ALCHEMY_RPC_URL],
    },
    public: {
      http: [ALCHEMY_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'WorldChain Explorer',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
}

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID || '67230c935989bb6922b0ee8f53bf9441'

const prodUrl = 'https://worldexo.vercel.app'
const baseUrl = typeof window !== 'undefined' 
  ? window.location.origin 
  : prodUrl

export const config = createConfig(
  getDefaultConfig({
    // Required API Keys
    walletConnectProjectId: walletConnectProjectId,

    // Required
    appName: "WorlDEX",

    // Optional
    appDescription: "Decentralized Exchange with World ID Authentication",
    appUrl: baseUrl,
    appIcon: `${baseUrl}/favicon.ico`,

    // Chain Config
    chains: [worldChainSepolia],
    transports: {
      [worldChainSepolia.id]: http(ALCHEMY_RPC_URL),
    },
  }),
)

import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { getDefaultConfig } from 'connectkit'

export const config = createConfig(
  getDefaultConfig({
    chains: [sepolia],
    transports: {
      [sepolia.id]: http(
        process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL!
      ),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID!,
    appName: "WorldEx",
  }),
)

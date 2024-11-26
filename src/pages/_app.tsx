import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { WagmiProvider } from 'wagmi'
import { ConnectKitProvider } from 'connectkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '../lib/config'
import { SessionProvider } from 'next-auth/react'

const queryClient = new QueryClient()

export default function App({ 
  Component, 
  pageProps: { session, ...pageProps } 
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ConnectKitProvider>
            <Component {...pageProps} />
          </ConnectKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  )
}

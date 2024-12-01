# WorldEx

A decentralized exchange with World ID authentication.

## Production Environment

- Production URL: https://worldchain-one.vercel.app
- World ID Callback URL: https://worldchain-one.vercel.app/api/auth/callback/worldcoin

## Vercel Environment Variables Setup

1. Go to your [Vercel Project Settings](https://vercel.com/dashboard) > Environment Variables
2. Add the following environment variables:

```bash
# Authentication (Required)
NEXTAUTH_URL=https://worldchain-one.vercel.app
NEXTAUTH_SECRET=0fjDAH3SRQM+jzbdAT2uLp4K7DxGUD8unbtopbSTvmw=

# World ID OAuth
WLD_CLIENT_ID=app_2a124e9650db276b1a861f7ab9891763
WLD_CLIENT_SECRET=sk_8a1fb67ed99ec6195d9b42713dc3953e99764cb65b48c45f

# Public Variables
NEXT_PUBLIC_APP_ID=app_2a124e9650db276b1a861f7ab9891763
NEXT_PUBLIC_ACTION="test-action"
NEXT_PUBLIC_WALLETCONNECT_ID=67230c935989bb6922b0ee8f53bf9441
NEXT_PUBLIC_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://worldchain-sepolia.g.alchemy.com/v2/dHgmedS39psbe_tuXLRsdUSupfWi85Rj
```

## World ID Configuration

1. Go to [World ID Developer Portal](https://developer.worldcoin.org)
2. Navigate to your app settings
3. Add the following redirect URI:
   ```
   https://worldchain-one.vercel.app/api/auth/callback/worldcoin
   ```

## Local Development

1. Install dependencies:
```bash
pnpm install
```

2. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

3. Run development server:
```bash
pnpm run dev
```

## Deployment Verification

After deploying to Vercel, verify the following:

1. Authentication Flow:
   - Visit https://worldchain-one.vercel.app
   - Click "Sign in with World ID"
   - Complete verification process
   - Check redirect back to app

2. Environment Variables:
   - Verify NEXTAUTH_SECRET is set
   - Check World ID credentials
   - Confirm callback URLs

3. Features:
   - World ID Authentication
   - MetaMask Integration
   - Contract Interactions
   - Protected Routes

## Tech Stack

- Next.js 13
- TypeScript
- NextAuth.js
- World ID
- Wagmi
- ConnectKit
- TailwindCSS
- Foundry (Smart Contracts)

## Project Structure

```
├── contracts/           # Smart contracts
├── public/             # Static assets
├── src/
│   ├── abi/           # Contract ABIs
│   ├── lib/           # Shared utilities
│   ├── pages/         # Next.js pages
│   ├── styles/        # Global styles
│   └── types/         # TypeScript types
├── .env.example       # Environment variables template
├── next.config.js     # Next.js configuration
├── vercel.json        # Vercel deployment configuration
└── tsconfig.json      # TypeScript configuration
```

## Environment Setup

### Development
```bash
NEXTAUTH_URL=http://localhost:3000
```

### Production
```bash
NEXTAUTH_URL=https://worldchain-one.vercel.app
```

## Troubleshooting

1. Authentication Issues:
   - Verify NEXTAUTH_SECRET is set in Vercel
   - Check World ID redirect URIs
   - Confirm environment variables

2. Build Errors:
   - Check Vercel build logs
   - Verify all dependencies are installed
   - Confirm environment variables are set

3. Contract Interactions:
   - Verify contract address
   - Check Alchemy RPC URL
   - Confirm MetaMask connection

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.

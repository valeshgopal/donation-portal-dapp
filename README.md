# Decentralized Donation Platform

A transparent and secure platform connecting cryptocurrency donors with verified recipients, built with Next.js, Ethereum, and IPFS.

## Features

- Wallet-based authentication
- Direct cryptocurrency donations
- Transparent transaction tracking
- Verified recipient profiles
- Decentralized proof storage
- KYC verification system

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: MongoDB, mongoose
- **Blockchain**: Ethereum, Ethers.js
- **Storage**: IPFS (web3.storage)
- **Authentication**: Wallet Connect

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables in `.env`

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   └── types/         # TypeScript types
├── contracts/          # Smart contracts
└── public/            # Static assets
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

'use client';

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { State, WagmiProvider } from 'wagmi';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { sepolia } from 'wagmi/chains';

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!;
const metadata = {
  name: 'Decentralized Donation Platform',
  description: 'Connect cryptocurrency donors with verified recipients',
  url: 'https://donation-platform.com',
  icons: ['https://donation-platform.com/icon.png'],
};

const chains = [sepolia] as const;
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

createWeb3Modal({ wagmiConfig: config, projectId });

export function Web3Provider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: State;
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

'use client';

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { State, WagmiProvider } from 'wagmi';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { mainnet } from 'wagmi/chains';

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!;
const metadata = {
  name: 'Decentralized Donation Platform',
  description: 'Connect cryptocurrency donors with verified recipients',
  url: process.env.NEXT_PUBLIC_DOMAIN_URL!,
  icons: [`${process.env.NEXT_PUBLIC_DOMAIN_URL!}/icon.png`],
};

const chains = [mainnet] as const;
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

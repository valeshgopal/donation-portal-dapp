'use client';

import { WagmiProvider } from 'wagmi';
import { config } from './lib/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const customTheme = darkTheme({
    accentColor: '#8B5CF6', // Your primary color (purple-500)
    accentColorForeground: '#FFFFFF', // White text on primary color
    borderRadius: 'medium',
    fontStack: 'system',
  });

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

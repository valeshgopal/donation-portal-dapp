import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'viem/chains';
import { http } from 'viem';

const WALLET_CONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

if (!RPC_URL) {
  throw new Error('NEXT_PUBLIC_RPC_URL environment variable is not set');
}

export const config = getDefaultConfig({
  appName: 'fingertips',
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(RPC_URL),
  },
  ssr: true,
});

'use client';

import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';

export function ConnectButton() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();

  return (
    <button
      onClick={() => open()}
      className='bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors'
    >
      {isConnected
        ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
        : 'Connect Wallet'}
    </button>
  );
}

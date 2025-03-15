'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export function Navbar() {
  const { address } = useAccount();

  return (
    <nav className='bg-white shadow-md'>
      <div className='container mx-auto px-4'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center space-x-8'>
            <Link
              href='/'
              className='text-gray-800 hover:text-primary font-semibold'
            >
              Home
            </Link>
            <Link
              href='/opportunities'
              className='text-gray-800 hover:text-primary font-semibold'
            >
              Browse
            </Link>

            {address && (
              <Link
                href='/dashboard'
                className='text-gray-800 hover:text-primary font-semibold'
              >
                Dashboard
              </Link>
            )}

            {address && (
              <Link
                href='/create'
                className='text-gray-800 hover:text-primary font-semibold'
              >
                Create Opportunity
              </Link>
            )}
          </div>
          <div>
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

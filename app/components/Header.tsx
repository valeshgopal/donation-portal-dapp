'use client';

import Link from 'next/link';
import { ConnectButton } from './ConnectButton';
import { useAccount } from 'wagmi';

export function Header() {
  const { isConnected } = useAccount();

  return (
    <header className='bg-white shadow-sm'>
      <nav className='container mx-auto px-4 py-4 flex items-center justify-between'>
        <Link href='/' className='text-xl font-bold text-primary'>
          Donation Platform
        </Link>

        <div className='flex items-center space-x-6'>
          <Link
            href='/opportunities'
            className='text-gray-600 hover:text-gray-900'
          >
            Browse
          </Link>
          {isConnected && (
            <>
              <Link
                href='/dashboard'
                className='text-gray-600 hover:text-gray-900'
              >
                Dashboard
              </Link>
              <Link
                href='/create'
                className='text-gray-600 hover:text-gray-900'
              >
                Create Opportunity
              </Link>
            </>
          )}
          <ConnectButton />
        </div>
      </nav>
    </header>
  );
}

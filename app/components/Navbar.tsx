'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useState } from 'react';

export function Navbar() {
  const { address } = useAccount();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className='bg-white shadow-md'>
      <div className='container mx-auto px-4'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center gap-2'>
            <img src='/favicon.jpg' className='hidden md:block w-20 h-20' />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='md:hidden p-2 hover:bg-gray-100 rounded-md'
              aria-label='Toggle menu'
            >
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                ) : (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                )}
              </svg>
            </button>

            <div
              className={`${
                isMenuOpen ? 'flex' : 'hidden'
              } md:flex flex-col md:flex-row absolute md:relative left-0 right-0 top-16 md:top-0 bg-white md:bg-transparent shadow-md md:shadow-none p-4 md:p-0 space-y-4 md:space-y-0 md:items-center md:space-x-8 z-50`}
            >
              <Link
                href='/'
                className='text-gray-800 hover:text-primary font-semibold'
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href='/opportunities'
                className='text-gray-800 hover:text-primary font-semibold'
                onClick={() => setIsMenuOpen(false)}
              >
                Browse
              </Link>

              {address && (
                <Link
                  href='/dashboard'
                  className='text-gray-800 hover:text-primary font-semibold'
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}

              {address && (
                <Link
                  href='/create'
                  className='text-gray-800 hover:text-primary font-semibold'
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create Opportunity
                </Link>
              )}
            </div>
          </div>
          <div className='z-50'>
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

import Link from 'next/link';
import { useState } from 'react';
import { Opportunity } from '../lib/contracts/types';
import { formatEther, parseEther } from 'viem';
export interface OpportunityCardProps {
  opportunity: Opportunity;
  userAddress?: `0x${string}`;
  onStopCampaign: (id: bigint) => Promise<void>;
  onDonate: (id: bigint, amount: bigint) => Promise<void>;
  featured?: boolean;
  showStopButton?: boolean;
  totalUserDonation?: number;
}

export function OpportunityCard({
  opportunity,
  userAddress,
  onStopCampaign,
  onDonate,
  featured,
  showStopButton = true,
  totalUserDonation,
}: OpportunityCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [isProcessingDonation, setIsProcessingDonation] = useState(false);

  const handleStopCampaign = async () => {
    try {
      setIsUpdating(true);
      await onStopCampaign(opportunity.id);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationAmount) return;

    try {
      setIsProcessingDonation(true);
      const amount = parseEther(donationAmount);
      await onDonate(opportunity.id, amount);
      setDonationAmount('');
    } finally {
      setIsProcessingDonation(false);
    }
  };

  const progress =
    (Number(opportunity.currentRaised) / Number(opportunity.fundingGoal)) * 100;

  return (
    <div className='bg-white rounded-lg shadow-md overflow-hidden'>
      <div className='p-6'>
        <div className='flex justify-between items-start mb-4'>
          <Link
            href={`/opportunities/${opportunity.address}`}
            className='text-xl font-semibold hover:text-primary truncate max-w-[80%] block'
          >
            {opportunity.title}
          </Link>
          <span
            className={`text-sm px-3 py-1 rounded-full ${
              opportunity.active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {opportunity.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p className='text-gray-600 mb-4 line-clamp-2'>{opportunity.summary}</p>

        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-500'>Goal</span>
            <span className='font-medium'>
              {formatEther(opportunity.fundingGoal)} ETH
            </span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-500'>Raised</span>
            <span className='font-medium'>
              {formatEther(opportunity.currentRaised)} ETH
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300 ease-in-out'
              style={{
                width: `${Math.min(progress, 100)}%`,
              }}
            />
          </div>
        </div>

        <div className='mt-4 flex flex-wrap gap-2'>
          {opportunity.cause.map((tag) => (
            <span
              key={tag}
              className='bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm'
            >
              {tag}
            </span>
          ))}
        </div>

        <div className='mt-4 text-sm text-gray-500'>
          <div>Location: {opportunity.location}</div>
        </div>

        {userAddress && (
          <form onSubmit={handleDonate} className='mt-4'>
            <div className='flex gap-2'>
              <input
                type='number'
                step='0.01'
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder='Amount in ETH'
                className='flex-1 border rounded-md px-3 py-2'
                disabled={isProcessingDonation || !opportunity.active}
              />
              <button
                type='submit'
                disabled={
                  !donationAmount || isProcessingDonation || !opportunity.active
                }
                className='bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50'
              >
                {isProcessingDonation
                  ? 'Processing...'
                  : opportunity.active
                  ? 'Donate'
                  : 'Ended'}
              </button>
            </div>
          </form>
        )}

        {totalUserDonation && (
          <p className='text-xs text-gray-500 mt-1'>
            Your contribution:{' '}
            <span className='font-semibold'>{totalUserDonation} ETH</span>
          </p>
        )}

        <div className='mt-6 space-y-2'>
          <div className='client-only'>
            <Link
              href={`/opportunities/${opportunity.address}`}
              className='block text-center bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90'
            >
              View Details
            </Link>
          </div>

          {showStopButton &&
            userAddress &&
            opportunity.creatorAddress === userAddress &&
            opportunity.active && (
              <button
                onClick={handleStopCampaign}
                disabled={isUpdating}
                className='w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50'
              >
                {isUpdating ? 'Stopping...' : 'Stop Campaign'}
              </button>
            )}
        </div>
      </div>
    </div>
  );
}

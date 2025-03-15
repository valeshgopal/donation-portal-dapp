'use client';

import { useAccount } from 'wagmi';
import { CreateOpportunityForm } from '../components/CreateOpportunityForm';

export default function CreateOpportunityPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>Connect Your Wallet</h1>
          <p className='text-gray-600'>
            Please connect your wallet to create a donation opportunity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-2xl font-bold mb-8 text-center'>
        Create Donation Opportunity
      </h1>
      <CreateOpportunityForm />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { OpportunityCard } from '../components/OpportunityCard';
import { useDonationOpportunities } from '../hooks/useDonationOpportunities';
import { Opportunity, UserDonation } from '../lib/contracts/types';

export default function DashboardPage() {
  const { address } = useAccount();
  const [donatedOpportunities, setDonatedOpportunities] = useState<
    Opportunity[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const donationOpportunities = useDonationOpportunities();

  useEffect(() => {
    const fetchDonatedOpportunities = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        // Get opportunities the user has donated to
        const opportunities =
          await donationOpportunities.getUserDonatedOpportunities(address);
        setDonatedOpportunities(opportunities);
      } catch (error) {
        console.error('Error fetching donated opportunities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonatedOpportunities();
  }, [address, donationOpportunities.getUserDonatedOpportunities]);

  const handleDonate = async (id: bigint, amount: bigint) => {
    try {
      await donationOpportunities.donate(id, amount);
      // Refresh the donations
      if (address) {
        const opportunities =
          await donationOpportunities.getUserDonatedOpportunities(address);
        setDonatedOpportunities(opportunities);
      }
    } catch (error) {
      console.error('Error donating:', error);
    }
  };

  if (isLoading) {
    return (
      <div className='animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-12 mx-4'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='h-96 w-356 bg-gray-200 rounded-lg'></div>
        ))}
      </div>
    );
  }

  if (!address) {
    return (
      <div className='container mx-auto px-4 py-16'>
        <div className='text-center'>
          <h1 className='text-3xl font-bold text-gray-900 mb-4'>
            Connect Your Wallet
          </h1>
          <p className='text-gray-600 mb-8'>
            Please connect your wallet to view your donation history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-8'>My Donations</h1>

      {donatedOpportunities.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {donatedOpportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id.toString()}
              opportunity={opportunity}
              userAddress={address}
              onDonate={handleDonate}
              showStopButton={false}
              totalUserDonation={opportunity.totalUserDonation}
              onStopCampaign={async () => {}} // Empty function since we don't need stop functionality here
            />
          ))}
        </div>
      ) : (
        <div className='text-center py-12 bg-white rounded-lg shadow-sm'>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            No Donations Yet
          </h2>
          <p className='text-gray-600 mb-6'>
            You haven't made any donations yet. Start making a difference today!
          </p>
          <Link
            href='/opportunities'
            className='inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors'
          >
            Browse Opportunities
          </Link>
        </div>
      )}
    </div>
  );
}

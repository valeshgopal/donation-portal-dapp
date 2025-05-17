'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { OpportunityCard } from '../components/OpportunityCard';
import { useDonationOpportunities } from '../hooks/useDonationOpportunities';
import { Opportunity } from '../lib/contracts/types';
import { useEthPrice } from '../hooks/useEthPrice';

// Helper function to get explorer URLs
const getExplorerUrl = (type: 'tx' | 'address', hash: string) => {
  return `${process.env.NEXT_PUBLIC_EXPLORER_URL}/${type}/${hash}`;
};

type TabType = 'created' | 'donated';

export default function DashboardPage() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const [donatedOpportunities, setDonatedOpportunities] = useState<
    Opportunity[]
  >([]);
  const [createdOpportunities, setCreatedOpportunities] = useState<
    Opportunity[]
  >([]);
  const [successMessage, setSuccessMessage] = useState<
    string | JSX.Element | null
  >(null);
  const donationOpportunities = useDonationOpportunities();
  const { minEthPrice } = useEthPrice();

  useEffect(() => {
    // Check for success message in sessionStorage
    const createdOpportunityStr = sessionStorage.getItem('opportunityCreated');
    if (createdOpportunityStr) {
      try {
        const { title, txHash } = JSON.parse(createdOpportunityStr);
        setSuccessMessage(
          <div>
            <p>
              "{title}" has been created successfully! It may take a few minutes
              to appear in your dashboard.
            </p>
            <p className='text-sm mt-2'>
              Transaction:{' '}
              <a
                href={getExplorerUrl('tx', txHash)}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:underline'
              >
                View on Etherscan
              </a>
            </p>
          </div>
        );
        sessionStorage.removeItem('opportunityCreated');
      } catch (error) {
        console.error('Error parsing opportunity data:', error);
        setSuccessMessage(
          'Opportunity created successfully! It may take a few minutes to appear in your dashboard.'
        );
      }
    }
  }, []);

  useEffect(() => {
    if (!address) return;

    // Filter created opportunities from hook's data
    const created = donationOpportunities.allOpportunities.filter(
      (opp) => opp.creatorAddress.toLowerCase() === address.toLowerCase()
    );
    setCreatedOpportunities(created);

    // Get donated opportunities
    donationOpportunities
      .getUserDonatedOpportunities(address)
      .then(setDonatedOpportunities);
  }, [
    address,
    donationOpportunities.allOpportunities,
    donationOpportunities.getUserDonatedOpportunities,
  ]);

  const handleDonate = async (id: bigint, amount: bigint) => {
    try {
      const txHash = await donationOpportunities.donate(id, amount);
      // Refresh the donations
      if (address) {
        const opportunities =
          await donationOpportunities.getUserDonatedOpportunities(address);
        setDonatedOpportunities(opportunities);
      }
      return txHash;
    } catch (error) {
      console.error('Error donating:', error);
      throw new Error('Failed to process donation. Please try again.');
    }
  };

  const handleStopCampaign = async (id: bigint) => {
    try {
      await donationOpportunities.stopOpportunity(id);
      // Refresh created opportunities
      if (address) {
        const created = donationOpportunities.allOpportunities.filter(
          (opp) => opp.creatorAddress.toLowerCase() === address.toLowerCase()
        );
        setCreatedOpportunities(created);
      }
    } catch (error) {
      console.error('Error stopping campaign:', error);
    }
  };

  if (donationOpportunities.isLoading) {
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
            Please connect your wallet to view your dashboard.
          </p>
        </div>
      </div>
    );
  }

  const opportunities =
    activeTab === 'created' ? createdOpportunities : donatedOpportunities;
  const emptyMessage =
    activeTab === 'created' ? 'No Created Opportunities' : 'No Donations Yet';
  const emptyDescription =
    activeTab === 'created'
      ? "You haven't created any opportunities yet. Create your first one!"
      : "You haven't made any donations yet. Browse opportunities to start donating!";
  const emptyActionLink =
    activeTab === 'created' ? '/create' : '/opportunities';
  const emptyActionText =
    activeTab === 'created' ? 'Create Opportunity' : 'Browse Opportunities';

  return (
    <div className='container mx-auto px-4 py-8'>
      {successMessage && (
        <div className='mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md'>
          {successMessage}
        </div>
      )}

      <div className='flex flex-col md:flex-row justify-between items-center mb-8'>
        <h1 className='text-2xl md:text-3xl font-bold'>My Dashboard</h1>
        <div className='flex items-center gap-4 mt-4 md:mt-0 bg-gray-100 p-1 rounded-lg'>
          <button
            onClick={() => setActiveTab('created')}
            className={`px-4 py-2 rounded-md transition-all ${
              activeTab === 'created'
                ? 'bg-white shadow text-primary'
                : 'text-gray-600 hover:text-primary'
            }`}
          >
            Created
          </button>
          <button
            onClick={() => setActiveTab('donated')}
            className={`px-4 py-2 rounded-md transition-all ${
              activeTab === 'donated'
                ? 'bg-white shadow text-primary'
                : 'text-gray-600 hover:text-primary'
            }`}
          >
            Donated
          </button>
        </div>
      </div>

      {opportunities.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id.toString()}
              opportunity={opportunity}
              userAddress={address}
              onStopCampaign={handleStopCampaign}
              onDonate={handleDonate}
              showStopButton={false}
              totalUserDonation={opportunity.totalUserDonation}
              minEthPrice={minEthPrice}
            />
          ))}
        </div>
      ) : (
        <div className='text-center py-12 bg-white rounded-lg shadow-sm'>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            {emptyMessage}
          </h2>
          <p className='text-gray-600 mb-8'>{emptyDescription}</p>
          <Link
            href={emptyActionLink}
            className='inline-block px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors'
          >
            {emptyActionText}
          </Link>
        </div>
      )}
    </div>
  );
}

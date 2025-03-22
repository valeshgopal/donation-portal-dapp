'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { OpportunityCard } from '../components/OpportunityCard';
import { useDonationOpportunities } from '../hooks/useDonationOpportunities';
import { Opportunity } from '../lib/contracts/types';

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
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const donationOpportunities = useDonationOpportunities();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState(currentPage.toString());
  const PAGE_SIZE = 9;
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Check for success message in sessionStorage
    const createdOpportunity = sessionStorage.getItem('opportunityCreated');
    if (createdOpportunity) {
      setSuccessMessage(
        `"${createdOpportunity}" has been created successfully! It may take a few minutes to appear in your dashboard.`
      );
      sessionStorage.removeItem('opportunityCreated');
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setPageInput('1');
  }, [activeTab]);

  useEffect(() => {
    const opportunities =
      activeTab === 'created' ? createdOpportunities : donatedOpportunities;
    setTotalPages(Math.max(1, Math.ceil(opportunities.length / PAGE_SIZE)));
  }, [activeTab, createdOpportunities, donatedOpportunities]);

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        // Get all opportunities and filter for ones created by user
        const opportunities = donationOpportunities.allOpportunities;
        const created = opportunities.filter(
          (opp) => opp.creatorAddress.toLowerCase() === address.toLowerCase()
        );
        setCreatedOpportunities(created ?? []);

        // Get opportunities the user has donated to
        const donated = await donationOpportunities.getUserDonatedOpportunities(
          address
        );
        setDonatedOpportunities(donated ?? []);
      } catch (error) {
        console.error('Error fetching opportunities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
  }, [
    address,
    donationOpportunities.getUserDonatedOpportunities,
    donationOpportunities.getAllOpportunities,
  ]);

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

  const handleStopCampaign = async (id: bigint) => {
    try {
      await donationOpportunities.stopOpportunity(id);
      // Refresh created opportunities
      if (address) {
        const all = await donationOpportunities.getAllOpportunities();
        const created = all.filter(
          (opp) => opp.creatorAddress.toLowerCase() === address.toLowerCase()
        );
        setCreatedOpportunities(created);
      }
    } catch (error) {
      console.error('Error stopping campaign:', error);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const getCurrentPageOpportunities = () => {
    const opportunities =
      activeTab === 'created' ? createdOpportunities : donatedOpportunities;
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return opportunities.slice(startIndex, endIndex);
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

  if (!isLoading && !address) {
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

      {isLoading ? (
        <div className='flex justify-center items-center min-h-[300px]'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
        </div>
      ) : getCurrentPageOpportunities().length > 0 ? (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {getCurrentPageOpportunities().map((opportunity) => (
              <OpportunityCard
                key={opportunity.id.toString()}
                opportunity={opportunity}
                userAddress={address}
                onDonate={handleDonate}
                showStopButton={activeTab === 'created'}
                totalUserDonation={opportunity.totalUserDonation}
                onStopCampaign={handleStopCampaign}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className='flex justify-center items-center gap-4 mt-8'>
              <button
                onClick={() => {
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                  setPageInput((prev) =>
                    Math.max(1, parseInt(prev) - 1).toString()
                  );
                }}
                disabled={currentPage === 1}
                className='px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50'
              >
                Previous
              </button>
              <form
                onSubmit={handlePageSubmit}
                className='flex items-center gap-2'
              >
                <input
                  type='number'
                  min='1'
                  max={totalPages}
                  value={pageInput}
                  onChange={handlePageInputChange}
                  className='w-16 px-2 py-1 border rounded'
                  aria-label='Go to page'
                />
                <button
                  type='submit'
                  className='px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600'
                >
                  Go
                </button>
              </form>
              <span className='text-gray-600'>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => {
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                  setPageInput((prev) =>
                    Math.min(totalPages, parseInt(prev) + 1).toString()
                  );
                }}
                disabled={currentPage === totalPages}
                className='px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50'
              >
                Next
              </button>
            </div>
          )}
        </>
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

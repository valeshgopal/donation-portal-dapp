'use client';

import { useEffect, useState, useCallback } from 'react';
import { OpportunityCard } from '../components/OpportunityCard';
import OpportunityFilters from '../components/OpportunityFilters';
import { useDonationOpportunities } from '../hooks/useDonationOpportunities';
import { Opportunity } from '../lib/contracts/types';
import { useAccount } from 'wagmi';
import { FaChevronLeft } from 'react-icons/fa';
import { FaChevronRight } from 'react-icons/fa';
import { useEthPrice } from '../hooks/useEthPrice';

export default function OpportunitiesPage() {
  const { address } = useAccount();
  const {
    opportunities,
    allOpportunities,
    isLoading,
    error: hookError,
    totalPages,
    currentPage,
    setCurrentPage,
    donate,
    stopOpportunity,
    handleFilter,
  } = useDonationOpportunities();
  const [filteredOpportunities, setFilteredOpportunities] = useState<
    Opportunity[]
  >([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(true);
  const [isModalOpened, setIsModalOpened] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { minEthPrice } = useEthPrice();

  // Update filtered opportunities when opportunities change
  useEffect(() => {
    setFilteredOpportunities(opportunities);
    setLastRefresh(new Date());
  }, [opportunities]);

  // Check localStorage only after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Ensure we're in the browser
      const modalOpened = localStorage.getItem('platformFeeModal');
      setIsModalOpened(!!modalOpened); // Convert to boolean
      setShowModal(!modalOpened); // Show modal if not previously opened
    }
  }, []);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('platformFeeModal', 'true');
    }
    setShowModal(false);
    setIsModalOpened(true);
  };

  const handleFilterChange = useCallback(
    (filters: {
      cause: string;
      location: string;
      status: 'active' | 'inactive' | 'all';
      search: string;
    }) => {
      handleFilter(filters);
    },
    [handleFilter]
  );

  const handleStopCampaign = useCallback(
    async (id: bigint) => {
      try {
        setError(null);
        await stopOpportunity(id);
      } catch (err) {
        console.error('Error stopping campaign:', err);
        setError('Failed to stop campaign. Please try again.');
      }
    },
    [stopOpportunity]
  );

  const handleDonate = useCallback(
    async (id: bigint, amount: bigint) => {
      try {
        setError(null);
        await donate(id, amount);
      } catch (err) {
        console.error('Error donating:', err);
        throw new Error('Failed to process donation. Please try again.');
      }
    },
    [donate]
  );

  const handleManualRefresh = useCallback(() => {
    setCurrentPage(1); // Reset to first page when manually refreshing
  }, [setCurrentPage]);

  // Add page input state
  const [pageInput, setPageInput] = useState(currentPage.toString());

  // Handle direct page navigation
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

  if (isLoading && opportunities.length === 0) {
    return (
      <div className='container mx-auto px-4 py-8 relative'>
        <h1 className='text-3xl font-bold mb-8'>Donation Opportunities</h1>
        <div className='animate-pulse space-y-4'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='h-48 bg-gray-200 rounded-lg'></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex flex-col md:flex-row justify-between items-center mb-8 gap-4'>
        <h1 className='text-2xl md:text-3xl font-bold'>
          Donation Opportunities
        </h1>
        {/* <div className='flex flex-col sm:flex-row items-center gap-4'>
          <span className='text-sm text-gray-500'>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className='w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50'
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div> */}
      </div>

      {(error || hookError) && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4'>
          <span className='block sm:inline'>{error || hookError?.message}</span>
        </div>
      )}

      <OpportunityFilters
        onFilterChange={handleFilterChange}
        causes={Array.from(
          new Set(allOpportunities.flatMap((opp) => opp.cause))
        )}
      />

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8'>
        {filteredOpportunities.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id.toString()}
            opportunity={opportunity}
            userAddress={address}
            onStopCampaign={handleStopCampaign}
            onDonate={handleDonate}
            minEthPrice={minEthPrice}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className='flex justify-center items-center space-x-2 mt-8'>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className='px-4 py-2 bg-gray-300 text-white rounded-md hover:bg-primary/90 disabled:opacity-30'
          >
            <FaChevronLeft />
          </button>
          <form onSubmit={handlePageSubmit} className='flex items-center gap-2'>
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
              className='px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90'
            >
              Go
            </button>
          </form>
          <span className='text-gray-600'>
            {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage >= totalPages}
            className='px-4 py-2 bg-gray-300 text-white rounded-md hover:bg-primary/90 disabled:opacity-30'
          >
            <FaChevronRight />
          </button>
        </div>
      )}

      {!isLoading && filteredOpportunities.length === 0 && !error && (
        <div className='text-center py-12'>
          <p className='text-gray-500'>
            No opportunities found matching your filters.
          </p>
        </div>
      )}

      {!isLoading &&
        filteredOpportunities.length > 0 &&
        showModal &&
        !isModalOpened && (
          <div className='fixed bottom-4 bg-green-600 w-3/4 md-w-1/2 left-1/2 transform -translate-x-1/2 p-2 rounded flex items-center justify-between'>
            <span className='text-sm text-white'>
              Transparency matters! A 5% platform fee helps us maintain and
              improve our services, while the remaining 95% of your donation
              goes directly to the recipient. Your support makes a real impact!
            </span>
            <button
              className='bg-primary text-white px-4 py-1 rounded ml-4 text-xs'
              onClick={handleClose}
            >
              Close
            </button>
          </div>
        )}
    </div>
  );
}

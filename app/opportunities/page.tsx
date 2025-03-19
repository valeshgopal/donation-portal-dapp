'use client';

import { useEffect, useState, useCallback } from 'react';
import { OpportunityCard } from '../components/OpportunityCard';
import OpportunityFilters from '../components/OpportunityFilters';
import { useDonationOpportunities } from '../hooks/useDonationOpportunities';
import { Opportunity } from '../lib/contracts/types';
import { useAccount } from 'wagmi';

export default function OpportunitiesPage() {
  const { address } = useAccount();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<
    Opportunity[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const donationOpportunities = useDonationOpportunities();

  const fetchOpportunities = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const opps = await donationOpportunities.getAllOpportunities();
      setOpportunities(opps);
      setFilteredOpportunities(opps);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      setError('Failed to fetch opportunities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [donationOpportunities.getAllOpportunities]);

  // Initial fetch
  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleFilterChange = useCallback(
    (filters: {
      cause: string;
      location: string;
      status: 'active' | 'inactive' | 'all';
    }) => {
      let filtered = opportunities;

      if (filters.cause) {
        filtered = filtered.filter((opp) => opp.cause.includes(filters.cause));
      }

      if (filters.location) {
        filtered = filtered.filter((opp) => opp.location === filters.location);
      }

      if (filters.status !== 'all') {
        filtered = filtered.filter((opp) => {
          if (filters.status === 'active') return opp.active;
          return !opp.active;
        });
      }

      setFilteredOpportunities(filtered);
    },
    [opportunities]
  );

  const handleStopCampaign = useCallback(
    async (id: bigint) => {
      try {
        setError(null);
        await donationOpportunities.stopOpportunity(id);
        // Refresh opportunities after stopping campaign
        await fetchOpportunities();
      } catch (error) {
        console.error('Error stopping campaign:', error);
        setError('Failed to stop campaign. Please try again.');
      }
    },
    [donationOpportunities.stopOpportunity, fetchOpportunities]
  );

  const handleDonate = useCallback(
    async (id: bigint, amount: bigint) => {
      try {
        setError(null);
        await donationOpportunities.donate(id, amount);
        // Refresh opportunities after donation
        await fetchOpportunities();
      } catch (error) {
        console.error('Error donating:', error);
        setError('Failed to process donation. Please try again.');
      }
    },
    [donationOpportunities.donate, fetchOpportunities]
  );

  const handleManualRefresh = useCallback(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  if (isLoading && opportunities.length === 0) {
    return (
      <div className='container mx-auto px-4 py-8'>
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
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-3xl font-bold'>Donation Opportunities</h1>
        <div className='flex items-center gap-4'>
          <span className='text-sm text-gray-500'>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className='px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50'
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4'>
          <span className='block sm:inline'>{error}</span>
        </div>
      )}

      <OpportunityFilters
        onFilterChange={handleFilterChange}
        causes={Array.from(new Set(opportunities.flatMap((opp) => opp.cause)))}
      />

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8'>
        {filteredOpportunities.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id.toString()}
            opportunity={opportunity}
            userAddress={address}
            onStopCampaign={handleStopCampaign}
            onDonate={handleDonate}
          />
        ))}
      </div>

      {!isLoading && filteredOpportunities.length === 0 && !error && (
        <div className='text-center py-12'>
          <p className='text-gray-500'>
            No opportunities found matching your filters.
          </p>
        </div>
      )}
    </div>
  );
}

import {
  useReadContract,
  useWriteContract,
  useAccount,
  usePublicClient,
} from 'wagmi';
import { opportunityFactoryABI } from '../lib/contracts/opportunityFactoryABI';
import { donationOpportunityABI } from '../lib/contracts/donationOpportunityABI';
import {
  DonationOpportunitiesContract,
  Opportunity,
  UserDonation,
} from '../lib/contracts/types';
import { useCallback, useEffect, useState } from 'react';
import { waitForTransactionReceipt } from '@wagmi/core';
import { type PublicClient, type WalletClient } from 'viem';

const FACTORY_ADDRESS = process.env
  .NEXT_PUBLIC_OPPORTUNITY_FACTORY_ADDRESS as `0x${string}`;

type OpportunityMetadata = {
  title: string;
  summary: string;
  description: string;
  location: string;
  cause: string;
  kyc: Array<{ ipfsHash: string; fileType: string; type: string }>;
  proofs: Array<{ ipfsHash: string; fileType: string; type: string }>;
};


const PAGE_SIZE = 9; // Number of opportunities per page

// Define the return type for the hook
interface DonationOpportunitiesHook {
  opportunities: Opportunity[];
  isLoading: boolean;
  error: Error | null;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  getOpportunitiesPaginated: (page: number) => Promise<{ opportunities: Opportunity[]; totalCount: number }>;
  createOpportunity: (
    title: string,
    summary: string,
    description: string,
    location: string,
    cause: string[],
    fundingGoal: bigint,
    walletAddress: `0x${string}`,
    metadataURI: string
  ) => Promise<bigint>;
  donate: (id: bigint, value: bigint) => Promise<void>;
  getActiveOpportunities: DonationOpportunitiesContract['getActiveOpportunities'];
  getAllOpportunities: DonationOpportunitiesContract['getAllOpportunities'];
  getOpportunity: DonationOpportunitiesContract['getOpportunity'];
  stopOpportunity: (id: bigint) => Promise<void>;
  getUserDonatedOpportunities: DonationOpportunitiesContract['getUserDonatedOpportunities'];
  getUserDonationsForOpportunity: DonationOpportunitiesContract['getUserDonationsForOpportunity'];
  getFeaturedOpportunities: DonationOpportunitiesContract['getFeaturedOpportunities'];
  refetch: () => Promise<any>;
}

// Helper function to fetch metadata from IPFS
const fetchMetadata = async (
  metadataURI: string
): Promise<OpportunityMetadata | null> => {
  try {
    const response = await fetch(`https://w3s.link/ipfs/${metadataURI}`);
    if (!response.ok) {
      console.error('Failed to fetch metadata:', response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
};

export function useDonationOpportunities(): DonationOpportunitiesHook {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const publicClient = usePublicClient();

  // Fetch opportunity details helper function
  const fetchOpportunityDetails = async (
    opportunityAddress: `0x${string}`,
    client: PublicClient,
    index: number
  ) => {
    try {
      const data = await client.readContract({
        address: opportunityAddress,
        abi: donationOpportunityABI,
        functionName: 'getOpportunityDetails',
      });

      if (!Array.isArray(data)) {
        throw new Error('Invalid data format from contract');
      }

      const [
        title,
        fundingGoal,
        currentRaised,
        recipientWallet,
        creatorAddress,
        metadataURI,
        active,
        createdAt,
        donorCount,
      ] = data;

      // Use the address as the ID (converted to a bigint)
      const id = BigInt(parseInt(opportunityAddress.slice(2), 16));

      // Fetch metadata from IPFS
      const metadata = await fetchMetadata(metadataURI);

      return {
        id,
        address: opportunityAddress,
        title,
        fundingGoal,
        currentRaised,
        recipientWallet,
        creatorAddress,
        metadataURI,
        active,
        createdAt,
        donorCount,
        metadata
      };
    } catch (err) {
      console.error(
        `Error fetching details for opportunity ${opportunityAddress}:`,
        err
      );
      throw err;
    }
  };

  // Fetch all opportunities once
  useEffect(() => {
    const fetchAllOpportunities = async () => {
      if (!publicClient) return;

      try {
        setIsLoading(true);
        setError(null);

        const allAddresses = await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: opportunityFactoryABI,
          functionName: 'getOpportunities',
        }) as `0x${string}`[];

        const opportunitiesData = await Promise.all(
          allAddresses.map(async (address, idx) => {
            const details = await fetchOpportunityDetails(address, publicClient, idx);
            return {
              id: details.id,
              address: details.address,
              title: details.title,
              summary: details.metadata?.summary || '',
              description: details.metadata?.description || '',
              location: details.metadata?.location || '',
              cause: details.metadata?.cause ? [details.metadata.cause] : [],
              fundingGoal: details.fundingGoal,
              currentRaised: details.currentRaised,
              walletAddress: details.recipientWallet,
              createdAt: details.createdAt,
              active: details.active,
              creatorAddress: details.creatorAddress,
              metadataURI: details.metadataURI,
              donorCount: details.donorCount,
              totalUserDonation: 0
            };
          })
        );

        setAllOpportunities(opportunitiesData);
        setTotalPages(Math.max(1, Math.ceil(opportunitiesData.length / PAGE_SIZE)));
      } catch (error) {
        console.error('Error fetching opportunities:', error);
        const errInstance = error instanceof Error ? error : new Error('Unknown error');
        setError(errInstance);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllOpportunities();
  }, [publicClient]);

  // Handle pagination in memory
  useEffect(() => {
    if (allOpportunities.length > 0) {
      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      setOpportunities(allOpportunities.slice(startIndex, endIndex));
    }
  }, [currentPage, allOpportunities]);

  // Ensure currentPage stays within valid bounds
  useEffect(() => {
    if (currentPage < 1) {
      setCurrentPage(1);
    } else if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getOpportunitiesPaginated = useCallback(
    async (page: number) => {
      const startIndex = (page - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const pageOpportunities = allOpportunities.slice(startIndex, endIndex);
      return { opportunities: pageOpportunities, totalCount: allOpportunities.length };
    },
    [allOpportunities]
  );

  // Write contract functions
  const { writeContractAsync: writeCreateOpportunity } = useWriteContract();

  const createOpportunity = async (
    title: string,
    summary: string,
    description: string,
    location: string,
    cause: string[],
    fundingGoal: bigint,
    walletAddress: `0x${string}`,
    metadataURI: string
  ): Promise<bigint> => {
    if (!publicClient) throw new Error('Public client not available');

    try {
      const hash = await writeCreateOpportunity({
        address: FACTORY_ADDRESS,
        abi: opportunityFactoryABI,
        functionName: 'createOpportunity',
        args: [title, fundingGoal, walletAddress, metadataURI],
      });

      if (!hash) throw new Error('Failed to create opportunity');

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });
      await refetch();

      // Return the opportunity ID (index in the array)
      const addresses = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: opportunityFactoryABI,
        functionName: 'getOpportunities',
      });

      return BigInt(Array.isArray(addresses) ? addresses.length - 1 : 0);
    } catch (err) {
      console.error('Error creating opportunity:', err);
      throw err;
    }
  };

  const { writeContractAsync: writeDonate } = useWriteContract();

  const donate = async (id: bigint, value: bigint): Promise<void> => {
    if (!publicClient) throw new Error('Public client not available');

    const opportunity = opportunities.find((opp) => opp.id === id);
    if (!opportunity) {
      throw new Error('Invalid opportunity ID');
    }

    try {
      const hash = await writeDonate({
        address: opportunity.address,
        abi: donationOpportunityABI,
        functionName: 'donate',
        value,
      });

      if (!hash) throw new Error('Failed to donate');

      await publicClient.waitForTransactionReceipt({
        hash,
      });
      await refetch();
    } catch (err) {
      console.error('Error donating:', err);
      throw err;
    }
  };

  const { writeContractAsync: writeStopOpportunity } = useWriteContract();

  const stopOpportunity = async (id: bigint): Promise<void> => {
    if (!publicClient) throw new Error('Public client not available');

    // Find the opportunity in the opportunities array
    const opportunity = opportunities.find((opp) => opp.id === id);
    if (!opportunity) {
      throw new Error('Invalid opportunity ID');
    }

    try {
      const hash = await writeStopOpportunity({
        address: opportunity.address,
        abi: donationOpportunityABI,
        functionName: 'stopOpportunity',
      });

      if (!hash) throw new Error('Failed to stop opportunity');

      await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60_000,
      });
      await refetch();
    } catch (err) {
      console.error('Error stopping opportunity:', err);
      throw err;
    }
  };

  const getActiveOpportunities = useCallback<
    DonationOpportunitiesContract['getActiveOpportunities']
  >(async () => {
    if (!publicClient) throw new Error('Public client not available');

    const activeOpportunities = opportunities.filter((opp) => opp.active);
    return Promise.all(
      activeOpportunities.map(async (opp) => {
        try {
          const details = await fetchOpportunityDetails(
            opp.address,
            publicClient,
            Number(opp.id)
          );
          return {
            id: BigInt(parseInt(opp.address.slice(2), 16)), // Convert address to BigInt
            address: opp.address, // Keep the address for reference
            title: details.title,
            summary: details.metadata?.summary || '',
            description: details.metadata?.description || '',
            location: details.metadata?.location || '',
            cause: details.metadata?.cause ? [details.metadata.cause] : [],
            fundingGoal: details.fundingGoal,
            currentRaised: details.currentRaised,
            walletAddress: details.recipientWallet,
            createdAt: details.createdAt,
            active: details.active,
            creatorAddress: details.creatorAddress,
            metadataURI: details.metadataURI,
          } as Opportunity;
        } catch (error) {
          console.error('Error reading opportunity:', error);
          return null;
        }
      })
    ).then((results) =>
      results.filter((opp): opp is Opportunity => opp !== null)
    );
  }, [opportunities, publicClient]);

  const getAllOpportunities = useCallback<
    DonationOpportunitiesContract['getAllOpportunities']
  >(async () => {
    if (!publicClient) throw new Error('Public client not available');

    // Return all opportunities without filtering by active status
    return Promise.all(
      opportunities.map(async (opp) => {
        try {
          const details = await fetchOpportunityDetails(
            opp.address,
            publicClient,
            Number(opp.id)
          );
          return {
            id: BigInt(parseInt(opp.address.slice(2), 16)),
            address: opp.address,
            title: details.title,
            summary: details.metadata?.summary || '',
            description: details.metadata?.description || '',
            location: details.metadata?.location || '',
            cause: details.metadata?.cause ? [details.metadata.cause] : [],
            fundingGoal: details.fundingGoal,
            currentRaised: details.currentRaised,
            walletAddress: details.recipientWallet,
            createdAt: details.createdAt,
            active: details.active,
            creatorAddress: details.creatorAddress,
            metadataURI: details.metadataURI,
          } as Opportunity;
        } catch (error) {
          console.error('Error reading opportunity:', error);
          return null;
        }
      })
    ).then((results) =>
      results.filter((opp): opp is Opportunity => opp !== null)
    );
  }, [opportunities, publicClient]);

  const getOpportunity = useCallback<
    DonationOpportunitiesContract['getOpportunity']
  >(
    async (id) => {
      if (!publicClient) throw new Error('Public client not available');

      // Find opportunity by ID (which is derived from address)
      const opp = opportunities.find(
        (o) => BigInt(parseInt(o.address.slice(2), 16)) === id
      );

      if (!opp) throw new Error('Invalid opportunity ID');

      const details = await fetchOpportunityDetails(
        opp.address,
        publicClient,
        Number(opp.id)
      );

      return {
        id,
        address: opp.address,
        title: details.title,
        summary: details.metadata?.summary || '',
        description: details.metadata?.description || '',
        location: details.metadata?.location || '',
        cause: details.metadata?.cause ? [details.metadata.cause] : [],
        fundingGoal: details.fundingGoal,
        currentRaised: details.currentRaised,
        walletAddress: details.recipientWallet,
        createdAt: details.createdAt,
        active: details.active,
        creatorAddress: details.creatorAddress,
        metadataURI: details.metadataURI,
      } as Opportunity;
    },
    [opportunities, publicClient]
  );

  const getTotalDonationsInEth = (donations: any[]) => {
    const totalWei = donations.reduce(
      (total, donation) => total + BigInt(donation.amount),
      BigInt(0)
    );
    return Number(totalWei) / 1e18; // Convert to ETH after summing
  };

  const getUserDonatedOpportunities = useCallback<
    DonationOpportunitiesContract['getUserDonatedOpportunities']
  >(
    async (user) => {
      if (!publicClient) throw new Error('Public client not available');

      const donatedOpportunities = await Promise.all(
        opportunities.map(async (opp, index) => {
          try {
            const donations = await publicClient.readContract({
              address: opp.address,
              abi: donationOpportunityABI,
              functionName: 'getUserDonations',
              args: [user],
            });

            if (!donations || (donations as any[]).length === 0) return null;

            const details = await fetchOpportunityDetails(
              opp.address,
              publicClient,
              index
            );
            return {
              id: BigInt(parseInt(opp.address.slice(2), 16)),
              title: details.title,
              address: opp.address,
              summary: details.metadata?.summary || '',
              description: details.metadata?.description || '',
              location: details.metadata?.location || '',
              cause: details.metadata?.cause ? [details.metadata.cause] : [],
              fundingGoal: details.fundingGoal,
              currentRaised: details.currentRaised,
              walletAddress: details.recipientWallet,
              createdAt: details.createdAt,
              active: details.active,
              creatorAddress: details.creatorAddress,
              metadataURI: details.metadataURI,
              totalUserDonation: getTotalDonationsInEth(donations as any[]),
            } as Opportunity;
          } catch (error) {
            console.error(
              'Error checking opportunity for user donations:',
              error
            );
            return null;
          }
        })
      );

      return donatedOpportunities.filter(
        (opp): opp is Opportunity => opp !== null
      );
    },
    [opportunities, publicClient]
  );

  const getUserDonationsForOpportunity = useCallback<
    DonationOpportunitiesContract['getUserDonationsForOpportunity']
  >(
    async (id, user) => {
      if (!publicClient) throw new Error('Public client not available');
      if (id < 0 || id >= opportunities.length)
        throw new Error('Invalid opportunity ID');

      const opp = opportunities[Number(id)];
      const donations = await publicClient.readContract({
        address: opp.address,
        abi: donationOpportunityABI,
        functionName: 'getUserDonations',
        args: [user],
      });

      return (donations as any[]).map((d) => ({
        amount: d.amount,
        timestamp: d.timestamp,
      })) as UserDonation[];
    },
    [opportunities, publicClient]
  );

  // Get featured opportunities based on criteria
  const getFeaturedOpportunities = useCallback<
    DonationOpportunitiesContract['getFeaturedOpportunities']
  >(async () => {
    if (!publicClient) throw new Error('Public client not available');

    // Filter active opportunities
    const activeOpportunities = opportunities.filter((opp) => opp.active);

    // Sort opportunities based on multiple criteria:
    // 1. Funding progress (currentRaised / fundingGoal)
    // 2. Number of donors
    // 3. Recent creation date
    const sortedOpportunities = [...activeOpportunities].sort((a, b) => {
      // Calculate funding progress
      const progressA = Number(a.currentRaised) / Number(a.fundingGoal);
      const progressB = Number(b.currentRaised) / Number(b.fundingGoal);

      // Combine multiple factors with different weights
      const scoreA =
        progressA * 0.4 +
        Number(a.donorCount) * 0.3 +
        Number(a.createdAt) * 0.3;
      const scoreB =
        progressB * 0.4 +
        Number(b.donorCount) * 0.3 +
        Number(b.createdAt) * 0.3;

      return scoreB - scoreA; // Sort in descending order
    });

    // Take top 3 opportunities as featured
    const featuredOpportunities = sortedOpportunities.slice(0, 3);

    // Map to Opportunity type
    return Promise.all(
      featuredOpportunities.map(async (opp) => {
        const metadata = await fetchMetadata(opp.metadataURI);
        return {
          id: opp.id,
          address: opp.address,
          title: opp.title,
          summary: metadata?.summary || '',
          description: metadata?.description || '',
          location: metadata?.location || '',
          cause: metadata?.cause ? [metadata.cause] : [],
          fundingGoal: opp.fundingGoal,
          currentRaised: opp.currentRaised,
          walletAddress: opp.walletAddress,
          createdAt: opp.createdAt,
          active: opp.active,
          creatorAddress: opp.creatorAddress,
          metadataURI: opp.metadataURI,
          donorCount: opp.donorCount,
          totalUserDonation: 0
        };
      })
    );
  }, [opportunities, publicClient]);

  // Refetch all opportunities
  const refetch = useCallback(async () => {
    const fetchAllOpportunities = async () => {
      if (!publicClient) return;

      try {
        setIsLoading(true);
        setError(null);

        const allAddresses = await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: opportunityFactoryABI,
          functionName: 'getOpportunities',
        }) as `0x${string}`[];

        const opportunitiesData = await Promise.all(
          allAddresses.map(async (address, idx) => {
            const details = await fetchOpportunityDetails(address, publicClient, idx);
            return {
              id: details.id,
              address: details.address,
              title: details.title,
              summary: details.metadata?.summary || '',
              description: details.metadata?.description || '',
              location: details.metadata?.location || '',
              cause: details.metadata?.cause ? [details.metadata.cause] : [],
              fundingGoal: details.fundingGoal,
              currentRaised: details.currentRaised,
              walletAddress: details.recipientWallet,
              createdAt: details.createdAt,
              active: details.active,
              creatorAddress: details.creatorAddress,
              metadataURI: details.metadataURI,
              donorCount: details.donorCount,
              totalUserDonation: 0
            };
          })
        );

        setAllOpportunities(opportunitiesData);
        setTotalPages(Math.max(1, Math.ceil(opportunitiesData.length / PAGE_SIZE)));
      } catch (error) {
        console.error('Error fetching opportunities:', error);
        const errInstance = error instanceof Error ? error : new Error('Unknown error');
        setError(errInstance);
      } finally {
        setIsLoading(false);
      }
    };

    await fetchAllOpportunities();
  }, [publicClient]);

  return {
    opportunities,
    isLoading,
    error,
    totalPages,
    currentPage,
    setCurrentPage,
    getOpportunitiesPaginated,
    createOpportunity,
    donate,
    getActiveOpportunities,
    getAllOpportunities,
    getOpportunity,
    stopOpportunity,
    getUserDonatedOpportunities,
    getUserDonationsForOpportunity,
    getFeaturedOpportunities,
    refetch,
  };
}

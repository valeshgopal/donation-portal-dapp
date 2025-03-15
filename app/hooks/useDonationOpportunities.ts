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

console.log('Factory Address:', FACTORY_ADDRESS);

type OpportunityMetadata = {
  title: string;
  summary: string;
  description: string;
  location: string;
  cause: string;
  kyc: Array<{ ipfsHash: string; fileType: string; type: string }>;
  proofs: Array<{ ipfsHash: string; fileType: string; type: string }>;
};

export type DonationOpportunity = {
  id: bigint;
  address: `0x${string}`;
  title: string;
  fundingGoal: bigint;
  currentRaised: bigint;
  recipientWallet: `0x${string}`;
  creatorAddress: `0x${string}`;
  metadataURI: string;
  active: boolean;
  createdAt: bigint;
  donorCount: bigint;
  metadata?: OpportunityMetadata;
};

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

export function useDonationOpportunities() {
  const [opportunities, setOpportunities] = useState<DonationOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const publicClient = usePublicClient();
  const { address: userAddress } = useAccount();

  // Get all opportunity addresses from factory
  const { data: opportunityAddresses = [], refetch: refetchAddresses } =
    useReadContract({
      address: FACTORY_ADDRESS,
      abi: opportunityFactoryABI,
      functionName: 'getOpportunities',
    });

  // Fetch opportunity details
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
        metadata,
      };
    } catch (err) {
      console.error(
        `Error fetching details for opportunity ${opportunityAddress}:`,
        err
      );
      throw err;
    }
  };

  // Fetch all opportunities
  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!publicClient) return;

      setIsLoading(true);
      setError(null);

      try {
        const details = await Promise.all(
          (opportunityAddresses as `0x${string}`[]).map((address, index) =>
            fetchOpportunityDetails(address, publicClient, index).then(
              (details) => ({
                ...details,
                metadata: details.metadata || undefined, // Convert null to undefined
              })
            )
          )
        );
        console.log('Fetched opportunity details:', details);
        setOpportunities(details);
      } catch (err) {
        console.error('Error fetching opportunities:', err);
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to fetch opportunities')
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
  }, [opportunityAddresses, publicClient]);

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
      await refetchAddresses();

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
      await refetchAddresses();
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
      await refetchAddresses();
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
              id: BigInt(index),
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
        const details = await fetchOpportunityDetails(
          opp.address,
          publicClient,
          Number(opp.id)
        );
        return {
          id: BigInt(parseInt(opp.address.slice(2), 16)), // Convert address to BigInt
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
      })
    );
  }, [opportunities, publicClient]);

  return {
    opportunities,
    isLoading,
    error,
    createOpportunity,
    donate,
    getActiveOpportunities,
    getAllOpportunities,
    getOpportunity,
    stopOpportunity,
    getUserDonatedOpportunities,
    getUserDonationsForOpportunity,
    getFeaturedOpportunities,
    refetch: refetchAddresses,
  };
}

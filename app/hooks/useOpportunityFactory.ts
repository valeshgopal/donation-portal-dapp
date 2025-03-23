'use client';

import { useCallback } from 'react';
import { parseEther } from 'viem';
import { useWriteContract, useReadContract } from 'wagmi';
import { opportunityFactoryABI } from '../lib/contracts/opportunityFactoryABI';

const factoryAddress = process.env
  .NEXT_PUBLIC_OPPORTUNITY_FACTORY_ADDRESS as `0x${string}`;

export function useOpportunityFactory() {
  const { writeContractAsync } = useWriteContract();

  const createOpportunity = useCallback(
    async (
      title: string,
      fundingGoal: string, // in ETH
      recipientWallet: `0x${string}`,
      metadataURI: string
    ) => {
      try {
        const tx = await writeContractAsync({
          address: factoryAddress,
          abi: opportunityFactoryABI,
          functionName: 'createOpportunity',
          args: [
            title,
            parseEther(fundingGoal), // Convert ETH to Wei for contract
            recipientWallet,
            metadataURI,
          ],
        });
        return tx;
      } catch (error) {
        console.error('Error creating opportunity:', error);
        throw error;
      }
    },
    [writeContractAsync]
  );

  const getOpportunities = useCallback(() => {
    return useReadContract({
      address: factoryAddress,
      abi: opportunityFactoryABI,
      functionName: 'getOpportunities',
    });
  }, []);

  const getOpportunityCreator = useCallback(
    (opportunityAddress: `0x${string}`) => {
      return useReadContract({
        address: factoryAddress,
        abi: opportunityFactoryABI,
        functionName: 'getOpportunityCreator',
        args: [opportunityAddress],
      });
    },
    []
  );

  const getOpportunityCount = useCallback(() => {
    return useReadContract({
      address: factoryAddress,
      abi: opportunityFactoryABI,
      functionName: 'getOpportunityCount',
    });
  }, []);

  return {
    createOpportunity,
    getOpportunities,
    getOpportunityCreator,
    getOpportunityCount,
  };
}

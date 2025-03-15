'use client';

import { useCallback } from 'react';
import { parseEther } from 'viem';
import { useWriteContract, useReadContract } from 'wagmi';
import { donationABI } from '../lib/contracts/donationABI';

const contractAddress = process.env
  .NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS as `0x${string}`;

export function useDonationContract() {
  const { writeContractAsync } = useWriteContract();

  const donate = useCallback(
    async (recipientAddress: `0x${string}`, amount: string) => {
      try {
        const tx = await writeContractAsync({
          address: contractAddress,
          abi: donationABI,
          functionName: 'donate',
          args: [recipientAddress],
          value: parseEther(amount),
        });
        return tx;
      } catch (error) {
        console.error('Error donating:', error);
        throw error;
      }
    },
    [writeContractAsync]
  );

  const getRecipient = useCallback((address: `0x${string}`) => {
    return useReadContract({
      address: contractAddress,
      abi: donationABI,
      functionName: 'getRecipient',
      args: [address],
    });
  }, []);

  return {
    donate,
    getRecipient,
  };
}

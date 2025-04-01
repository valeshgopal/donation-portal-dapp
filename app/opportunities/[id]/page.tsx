"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useDonationOpportunities } from "../../hooks/useDonationOpportunities";
import { Opportunity } from "../../lib/contracts/types";
import { formatEther, parseEther } from "viem";
import { Suspense } from "react";
import toast from "react-hot-toast";
import { useEthPrice } from "../../hooks/useEthPrice";

// Helper function to get Sepolia explorer URLs
const getExplorerUrl = (type: "tx" | "address", hash: string) => {
  return `https://sepolia.etherscan.io/${type}/${hash}`;
};

function OpportunityContent() {
  const params = useParams();
  const opportunityAddress = params?.id as string;
  const { address } = useAccount();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState("");
  const [isProcessingDonation, setIsProcessingDonation] = useState(false);
  const [isStoppingCampaign, setIsStoppingCampaign] = useState(false);
  const donationOpportunities = useDonationOpportunities();
  const { minEthPrice } = useEthPrice();

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        const id = BigInt(parseInt(opportunityAddress.slice(2), 16));
        const opp = await donationOpportunities.getOpportunity(id);
        if (!opp) throw new Error("Opportunity not found");
        setOpportunity(opp);
      } catch (error) {
        console.error("Error fetching opportunity:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (opportunityAddress) {
      fetchOpportunity();
    }
  }, [opportunityAddress, donationOpportunities.getOpportunity]);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationAmount || !opportunity) return;

    try {
      setIsProcessingDonation(true);
      const amount = parseEther(donationAmount);

      await donationOpportunities.donate(opportunity.id, amount);
      // Refresh opportunity data
      await donationOpportunities.refetch();
      const updatedOpp = await donationOpportunities.getOpportunity(
        opportunity.id
      );
      if (updatedOpp) setOpportunity(updatedOpp);
      setDonationAmount("");
      toast.success("Donation successful! Thank you for your contribution.");
    } catch (error) {
      console.error("Error donating:", error);
      toast.error("Failed to process donation. Please try again.");
    } finally {
      setIsProcessingDonation(false);
    }
  };

  const handleStopCampaign = async () => {
    if (!opportunity) return;

    try {
      setIsStoppingCampaign(true);
      await donationOpportunities.stopOpportunity(opportunity.id);
      // Refresh opportunity data
      const allOpps = await donationOpportunities.getAllOpportunities();
      const updatedOpp = allOpps.find((o) => o.address === opportunityAddress);
      if (updatedOpp) setOpportunity(updatedOpp);
    } catch (error) {
      console.error("Error stopping campaign:", error);
    } finally {
      setIsStoppingCampaign(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const progress =
    (Number(opportunity.currentRaised) / Number(opportunity.fundingGoal)) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold">{opportunity.title}</h1>
              <span
                className={`text-sm px-3 py-1 rounded-full ${
                  opportunity.active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {opportunity.active ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Add blockchain verification section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">
                Blockchain Verification
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Contract Address:</span>{" "}
                  <a
                    href={getExplorerUrl("address", opportunity.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View on Etherscan
                  </a>
                </div>
                <div>
                  <span className="text-gray-600">Creator Address:</span>{" "}
                  <a
                    href={getExplorerUrl("address", opportunity.creatorAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View on Etherscan
                  </a>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-gray-600 text-lg mb-4">
                {opportunity.summary}
              </p>
              <p className="text-gray-800 whitespace-pre-wrap">
                {opportunity.description}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Funding Progress</h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Goal</span>
                    <span className="font-medium">
                      {formatEther(opportunity.fundingGoal)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Raised</span>
                    <span className="font-medium">
                      {formatEther(opportunity.currentRaised)} ETH
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300 ease-in-out"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-gray-500">Location</h3>
                    <p className="font-medium">{opportunity.location}</p>
                  </div>
                  <div>
                    <h3 className="text-gray-500">Causes</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {opportunity.cause.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {address && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    Make a Donation
                  </h2>
                  <form onSubmit={handleDonate} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="number"
                        step="any"
                        min={minEthPrice}
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        placeholder={`${
                          minEthPrice > 0 ? "min: " + minEthPrice : ""
                        } ETH`}
                        className="w-full sm:flex-1 border rounded-md px-3 py-2 text-sm sm:text-base"
                        disabled={isProcessingDonation || !opportunity.active}
                      />
                      <button
                        type="submit"
                        disabled={
                          !donationAmount ||
                          parseFloat(donationAmount) < minEthPrice ||
                          isProcessingDonation ||
                          !opportunity.active
                        }
                        className="w-full sm:w-auto bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
                      >
                        {isProcessingDonation
                          ? "Processing..."
                          : opportunity.active
                          ? "Donate"
                          : "Ended"}
                      </button>
                    </div>
                    {!opportunity.active && (
                      <p className="text-red-600 text-sm mt-2">
                        This campaign has ended and is no longer accepting
                        donations.
                      </p>
                    )}
                  </form>
                </div>
              )}

              {address &&
                opportunity.creatorAddress === address &&
                opportunity.active && (
                  <div>
                    <button
                      onClick={handleStopCampaign}
                      disabled={isStoppingCampaign}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {isStoppingCampaign
                        ? "Stopping Campaign..."
                        : "Stop Campaign"}
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OpportunityDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      }
    >
      <OpportunityContent />
    </Suspense>
  );
}

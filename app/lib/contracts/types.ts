import { Address } from 'viem';

export type Opportunity = {
  id: bigint;
  address: `0x${string}`;
  title: string;
  summary: string;
  description: string;
  location: string;
  cause: string[];
  fundingGoal: bigint;
  currentRaised: bigint;
  walletAddress: `0x${string}`;
  createdAt: bigint;
  active: boolean;
  creatorAddress: `0x${string}`;
  metadataURI: string;
  totalUserDonation: number;
};

export interface UserDonation {
  amount: bigint;
  timestamp: bigint;
}

export interface DonationOpportunitiesContract {
  createOpportunity: (
    title: string,
    summary: string,
    description: string,
    location: string,
    cause: string[],
    fundingGoal: bigint,
    walletAddress: Address,
    metadataURI: string
  ) => Promise<bigint>;

  donate: (id: bigint, value: bigint) => Promise<void>;

  getActiveOpportunities: () => Promise<Opportunity[]>;

  getAllOpportunities: () => Promise<Opportunity[]>;

  getOpportunity: (id: bigint) => Promise<Opportunity>;

  stopOpportunity: (id: bigint) => Promise<void>;

  getUserDonatedOpportunities: (user: `0x${string}`) => Promise<Opportunity[]>;

  getUserDonationsForOpportunity: (
    id: bigint,
    user: `0x${string}`
  ) => Promise<UserDonation[]>;

  getFeaturedOpportunities: () => Promise<Opportunity[]>;
}

export interface OpportunityCreatedEvent {
  id: bigint;
  creator: Address;
  title: string;
  fundingGoal: bigint;
}

export interface OpportunityUpdatedEvent {
  id: bigint;
  active: boolean;
}

export interface DonationReceivedEvent {
  id: bigint;
  donor: Address;
  amount: bigint;
}

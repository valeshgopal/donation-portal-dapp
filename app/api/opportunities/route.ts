import { NextResponse } from 'next/server';
import { uploadToIPFS } from '../../lib/ipfs';

export type Opportunity = {
  id: string;
  title: string;
  summary: string;
  description: string;
  location: { country: string };
  cause: string[];
  fundingGoal: number;
  currentRaised: number;
  walletAddress: string;
  createdAt: string;
  active: boolean;
  creatorAddress: string;
  proofs: Array<{
    id: string;
    ipfsHash: string;
    fileType: string;
    description: string;
  }>;
};

// Mock opportunities data
export const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    title: 'Support Local Food Bank',
    summary: 'Help us provide meals to families in need',
    description:
      'Our food bank serves over 1000 families monthly. Your donation helps us purchase supplies and maintain our facilities.',
    location: { country: 'United States' },
    cause: ['Hunger'],
    fundingGoal: 5,
    currentRaised: 2.5,
    walletAddress: '0x1234567890123456789012345678901234567890',
    creatorAddress: '0x1234567890123456789012345678901234567890',
    createdAt: '2024-01-01T00:00:00Z',
    active: true,
    proofs: [
      {
        id: '1',
        ipfsHash: 'QmX5F8aFJ6J5J5J5J5J5J5J5J5J5J5J5J5J5J5J5',
        fileType: 'pdf',
        description: 'Food Bank Registration Certificate',
      },
      {
        id: '2',
        ipfsHash: 'QmX5F8aFJ6J5J5J5J5J5J5J5J5J5J5J5J5J5J5J6',
        fileType: 'pdf',
        description: 'Annual Impact Report',
      },
    ],
  },
  {
    id: '2',
    title: 'Emergency Medical Support',
    summary: 'Support critical medical care for underserved communities',
    description:
      'We provide essential medical services to those who cannot afford treatment. Your contribution saves lives.',
    location: { country: 'India' },
    cause: ['Healthcare'],
    fundingGoal: 10,
    currentRaised: 3.2,
    walletAddress: '0x2345678901234567890123456789012345678901',
    creatorAddress: '0x2345678901234567890123456789012345678901',
    createdAt: '2024-01-15T00:00:00Z',
    active: true,
    proofs: [
      {
        id: '3',
        ipfsHash: 'QmX5F8aFJ6J5J5J5J5J5J5J5J5J5J5J5J5J5J5J7',
        fileType: 'pdf',
        description: 'Medical License',
      },
    ],
  },
  {
    id: '3',
    title: 'Education for All',
    summary: 'Provide education resources to rural schools',
    description:
      'Help us supply books, computers, and learning materials to schools in rural areas.',
    location: { country: 'Kenya' },
    cause: ['Education'],
    fundingGoal: 3,
    currentRaised: 1.8,
    walletAddress: '0x3456789012345678901234567890123456789012',
    creatorAddress: '0x3456789012345678901234567890123456789012',
    createdAt: '2024-02-01T00:00:00Z',
    active: true,
    proofs: [
      {
        id: '4',
        ipfsHash: 'QmX5F8aFJ6J5J5J5J5J5J5J5J5J5J5J5J5J5J5J8',
        fileType: 'pdf',
        description: 'School Registration Documents',
      },
      {
        id: '5',
        ipfsHash: 'QmX5F8aFJ6J5J5J5J5J5J5J5J5J5J5J5J5J5J5J9',
        fileType: 'pdf',
        description: 'Previous Project Results',
      },
    ],
  },
];

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      title,
      summary,
      description,
      location,
      cause,
      fundingGoal,
      walletAddress,
      creatorAddress,
    } = data;

    // Create metadata
    const metadata = {
      title,
      summary,
      description,
      location: { country: location },
      cause: [cause],
      fundingGoal: parseFloat(fundingGoal),
      walletAddress,
      creatorAddress,
      createdAt: new Date().toISOString(),
      active: true,
      proofs: [],
    };

    // Upload to IPFS
    const ipfsHash = await uploadToIPFS(metadata);

    return NextResponse.json({ ...metadata, ipfsHash });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to create opportunity' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(mockOpportunities);
}

// Add PATCH endpoint to update opportunity status
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const { id, active, creatorAddress } = data;

    // Find the opportunity
    const opportunity = mockOpportunities.find((opp) => opp.id === id);

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Verify creator
    if (opportunity.creatorAddress !== creatorAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update status
    opportunity.active = active;

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to update opportunity' },
      { status: 500 }
    );
  }
}

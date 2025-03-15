export const donationOpportunitiesABI = [
  {
    'inputs': [
      {
        'internalType': 'string',
        'name': '_title',
        'type': 'string',
      },
      {
        'internalType': 'string',
        'name': '_summary',
        'type': 'string',
      },
      {
        'internalType': 'string',
        'name': '_description',
        'type': 'string',
      },
      {
        'internalType': 'string',
        'name': '_location',
        'type': 'string',
      },
      {
        'internalType': 'string[]',
        'name': '_cause',
        'type': 'string[]',
      },
      {
        'internalType': 'uint256',
        'name': '_fundingGoal',
        'type': 'uint256',
      },
      {
        'internalType': 'address payable',
        'name': '_walletAddress',
        'type': 'address',
      },
      {
        'internalType': 'string',
        'name': '_metadataURI',
        'type': 'string',
      },
    ],
    'name': 'createOpportunity',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
    ],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '_id',
        'type': 'uint256',
      },
    ],
    'name': 'donate',
    'outputs': [],
    'stateMutability': 'payable',
    'type': 'function',
  },
  {
    'inputs': [],
    'name': 'getActiveOpportunities',
    'outputs': [
      {
        'components': [
          {
            'internalType': 'uint256',
            'name': 'id',
            'type': 'uint256',
          },
          {
            'internalType': 'string',
            'name': 'title',
            'type': 'string',
          },
          {
            'internalType': 'string',
            'name': 'summary',
            'type': 'string',
          },
          {
            'internalType': 'string',
            'name': 'description',
            'type': 'string',
          },
          {
            'internalType': 'string',
            'name': 'location',
            'type': 'string',
          },
          {
            'internalType': 'string[]',
            'name': 'cause',
            'type': 'string[]',
          },
          {
            'internalType': 'uint256',
            'name': 'fundingGoal',
            'type': 'uint256',
          },
          {
            'internalType': 'uint256',
            'name': 'currentRaised',
            'type': 'uint256',
          },
          {
            'internalType': 'address payable',
            'name': 'walletAddress',
            'type': 'address',
          },
          {
            'internalType': 'uint256',
            'name': 'createdAt',
            'type': 'uint256',
          },
          {
            'internalType': 'bool',
            'name': 'active',
            'type': 'bool',
          },
          {
            'internalType': 'address',
            'name': 'creatorAddress',
            'type': 'address',
          },
          {
            'internalType': 'string',
            'name': 'metadataURI',
            'type': 'string',
          },
        ],
        'internalType': 'struct DonationOpportunities.Opportunity[]',
        'name': '',
        'type': 'tuple[]',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [],
    'name': 'getAllOpportunities',
    'outputs': [
      {
        'components': [
          {
            'internalType': 'uint256',
            'name': 'id',
            'type': 'uint256',
          },
          {
            'internalType': 'string',
            'name': 'title',
            'type': 'string',
          },
          {
            'internalType': 'string',
            'name': 'summary',
            'type': 'string',
          },
          {
            'internalType': 'string',
            'name': 'description',
            'type': 'string',
          },
          {
            'internalType': 'string',
            'name': 'location',
            'type': 'string',
          },
          {
            'internalType': 'string[]',
            'name': 'cause',
            'type': 'string[]',
          },
          {
            'internalType': 'uint256',
            'name': 'fundingGoal',
            'type': 'uint256',
          },
          {
            'internalType': 'uint256',
            'name': 'currentRaised',
            'type': 'uint256',
          },
          {
            'internalType': 'address payable',
            'name': 'walletAddress',
            'type': 'address',
          },
          {
            'internalType': 'uint256',
            'name': 'createdAt',
            'type': 'uint256',
          },
          {
            'internalType': 'bool',
            'name': 'active',
            'type': 'bool',
          },
          {
            'internalType': 'address',
            'name': 'creatorAddress',
            'type': 'address',
          },
          {
            'internalType': 'string',
            'name': 'metadataURI',
            'type': 'string',
          },
        ],
        'internalType': 'struct DonationOpportunities.Opportunity[]',
        'name': '',
        'type': 'tuple[]',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '_id',
        'type': 'uint256',
      },
    ],
    'name': 'getOpportunity',
    'outputs': [
      {
        'components': [
          {
            'internalType': 'uint256',
            'name': 'id',
            'type': 'uint256',
          },
          {
            'internalType': 'string',
            'name': 'title',
            'type': 'string',
          },
          {
            'internalType': 'string',
            'name': 'summary',
            'type': 'string',
          },
          {
            'internalType': 'string',
            'name': 'description',
            'type': 'string',
          },
          {
            'internalType': 'string',
            'name': 'location',
            'type': 'string',
          },
          {
            'internalType': 'string[]',
            'name': 'cause',
            'type': 'string[]',
          },
          {
            'internalType': 'uint256',
            'name': 'fundingGoal',
            'type': 'uint256',
          },
          {
            'internalType': 'uint256',
            'name': 'currentRaised',
            'type': 'uint256',
          },
          {
            'internalType': 'address payable',
            'name': 'walletAddress',
            'type': 'address',
          },
          {
            'internalType': 'uint256',
            'name': 'createdAt',
            'type': 'uint256',
          },
          {
            'internalType': 'bool',
            'name': 'active',
            'type': 'bool',
          },
          {
            'internalType': 'address',
            'name': 'creatorAddress',
            'type': 'address',
          },
          {
            'internalType': 'string',
            'name': 'metadataURI',
            'type': 'string',
          },
        ],
        'internalType': 'struct DonationOpportunities.Opportunity',
        'name': '',
        'type': 'tuple',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '_id',
        'type': 'uint256',
      },
    ],
    'name': 'stopOpportunity',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'uint256',
        'name': 'id',
        'type': 'uint256',
      },
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'creator',
        'type': 'address',
      },
      {
        'indexed': false,
        'internalType': 'string',
        'name': 'title',
        'type': 'string',
      },
      {
        'indexed': false,
        'internalType': 'uint256',
        'name': 'fundingGoal',
        'type': 'uint256',
      },
    ],
    'name': 'OpportunityCreated',
    'type': 'event',
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'uint256',
        'name': 'id',
        'type': 'uint256',
      },
      {
        'indexed': false,
        'internalType': 'bool',
        'name': 'active',
        'type': 'bool',
      },
    ],
    'name': 'OpportunityUpdated',
    'type': 'event',
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'uint256',
        'name': 'id',
        'type': 'uint256',
      },
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'donor',
        'type': 'address',
      },
      {
        'indexed': false,
        'internalType': 'uint256',
        'name': 'amount',
        'type': 'uint256',
      },
    ],
    'name': 'DonationReceived',
    'type': 'event',
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '_user',
        'type': 'address',
      },
    ],
    'name': 'getUserDonatedOpportunities',
    'outputs': [
      {
        'components': [
          {
            'internalType': 'uint256',
            'name': 'id',
            'type': 'uint256',
          },
          {
            'internalType': 'string',
            'name': 'title',
            'type': 'string',
          },
          {
            'internalType': 'string',
            'name': 'summary',
            'type': 'string',
          },
          {
            'internalType': 'string',
            'name': 'description',
            'type': 'string',
          },
          {
            'internalType': 'string',
            'name': 'location',
            'type': 'string',
          },
          {
            'internalType': 'string[]',
            'name': 'cause',
            'type': 'string[]',
          },
          {
            'internalType': 'uint256',
            'name': 'fundingGoal',
            'type': 'uint256',
          },
          {
            'internalType': 'uint256',
            'name': 'currentRaised',
            'type': 'uint256',
          },
          {
            'internalType': 'address payable',
            'name': 'walletAddress',
            'type': 'address',
          },
          {
            'internalType': 'uint256',
            'name': 'createdAt',
            'type': 'uint256',
          },
          {
            'internalType': 'bool',
            'name': 'active',
            'type': 'bool',
          },
          {
            'internalType': 'address',
            'name': 'creatorAddress',
            'type': 'address',
          },
          {
            'internalType': 'string',
            'name': 'metadataURI',
            'type': 'string',
          },
        ],
        'internalType': 'struct DonationOpportunities.Opportunity[]',
        'name': '',
        'type': 'tuple[]',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '_id',
        'type': 'uint256',
      },
      {
        'internalType': 'address',
        'name': '_user',
        'type': 'address',
      },
    ],
    'name': 'getUserDonationsForOpportunity',
    'outputs': [
      {
        'components': [
          {
            'internalType': 'uint256',
            'name': 'amount',
            'type': 'uint256',
          },
          {
            'internalType': 'uint256',
            'name': 'timestamp',
            'type': 'uint256',
          },
        ],
        'internalType': 'struct DonationOpportunities.UserDonation[]',
        'name': '',
        'type': 'tuple[]',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
];

export const opportunityFactoryABI = [
  {
    'inputs': [],
    'stateMutability': 'nonpayable',
    'type': 'constructor',
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'opportunityAddress',
        'type': 'address',
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
        'internalType': 'string',
        'name': 'metadataURI',
        'type': 'string',
      },
    ],
    'name': 'OpportunityCreated',
    'type': 'event',
  },
  {
    'inputs': [
      {
        'internalType': 'string',
        'name': '_title',
        'type': 'string',
      },
      {
        'internalType': 'uint256',
        'name': '_fundingGoal',
        'type': 'uint256',
      },
      {
        'internalType': 'address',
        'name': '_recipientWallet',
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
        'internalType': 'address',
        'name': '',
        'type': 'address',
      },
    ],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'inputs': [],
    'name': 'getOpportunities',
    'outputs': [
      {
        'internalType': 'address[]',
        'name': '',
        'type': 'address[]',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [],
    'name': 'getOpportunityCount',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '_opportunity',
        'type': 'address',
      },
    ],
    'name': 'getOpportunityCreator',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
];

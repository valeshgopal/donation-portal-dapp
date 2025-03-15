export const donationABI = [
  {
    'inputs': [],
    'stateMutability': 'nonpayable',
    'type': 'constructor',
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '_recipient',
        'type': 'address',
      },
    ],
    'name': 'donate',
    'outputs': [],
    'stateMutability': 'payable',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '_recipient',
        'type': 'address',
      },
    ],
    'name': 'getRecipient',
    'outputs': [
      {
        'components': [
          {
            'internalType': 'bool',
            'name': 'isVerified',
            'type': 'bool',
          },
          {
            'internalType': 'uint256',
            'name': 'totalReceived',
            'type': 'uint256',
          },
          {
            'internalType': 'string',
            'name': 'metadata',
            'type': 'string',
          },
        ],
        'internalType': 'struct DonationPlatform.Recipient',
        'name': '',
        'type': 'tuple',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [],
    'name': 'pause',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'inputs': [],
    'name': 'unpause',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '_newFeePercentage',
        'type': 'uint256',
      },
    ],
    'name': 'updateFeePercentage',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '_recipient',
        'type': 'address',
      },
      {
        'internalType': 'string',
        'name': '_metadata',
        'type': 'string',
      },
    ],
    'name': 'verifyRecipient',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'inputs': [],
    'name': 'withdrawFees',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'inputs': [{ 'internalType': 'string', 'name': 'cid', 'type': 'string' }],
    'name': 'createOpportunity',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'inputs': [],
    'name': 'getOpportunities',
    'outputs': [{ 'internalType': 'string[]', 'name': '', 'type': 'string[]' }],
    'stateMutability': 'view',
    'type': 'function',
  },
] as const;

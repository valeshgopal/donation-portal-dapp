require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();
require('@nomicfoundation/hardhat-ethers');
require('@nomicfoundation/hardhat-verify');

const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  '0000000000000000000000000000000000000000000000000000000000000000';
const SEPOLIA_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || '';

const config = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sepolia: {
      url: SEPOLIA_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

module.exports = config;

import { ethers } from 'ethers';

// Define the Chainlink ETH/USD price feed address (Mainnet example)
const ETH_USD_PRICE_FEED_ADDRESS = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'; // Change based on the network
//sepolia feed address - 0x694AA1769357215DE4FAC081bf1f309aDC325306
//mainnet feed address - 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

export const MIN_USD_AMOUNT = 1;

export async function getEthPrice(usdAmount: number) {
  try {
    // Connect to an Ethereum provider (e.g., Infura, Alchemy, or local node)
    const provider = new ethers.JsonRpcProvider(`${RPC_URL}`);

    // Create an instance of the price feed contract
    const priceFeed = new ethers.Contract(
      ETH_USD_PRICE_FEED_ADDRESS,
      [
        'function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80)',
      ],
      provider
    );

    // Fetch the latest price
    const [, price] = await priceFeed.latestRoundData();

    // Convert price from 8 decimals to standard format
    return parseFloat(ethers.formatUnits(price, 8));

    // Convert USD to ETH and round to 4 decimal
  } catch (error) {
    console.error('Error fetching ETH price:', error);
  }
}

export async function convertUsdToEth(usdAmount: number) {
  const ethPrice = await getEthPrice(usdAmount);
  if (!ethPrice) return null;
  return (usdAmount / ethPrice)?.toFixed(4);
}

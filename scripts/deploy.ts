import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { run } from 'hardhat';

dotenv.config();

async function main() {
  // Get the fee recipient address from environment variables
  const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS;
  if (!feeRecipient) {
    throw new Error('FEE_RECIPIENT_ADDRESS not set in environment variables');
  }

  // Ensure the address is properly formatted
  const formattedFeeRecipient = ethers.getAddress(feeRecipient);
  console.log(
    'Deploying OpportunityFactory with fee recipient:',
    formattedFeeRecipient
  );

  // Deploy OpportunityFactory
  const OpportunityFactory = await ethers.getContractFactory(
    'OpportunityFactory'
  );
  const factory = await OpportunityFactory.deploy(formattedFeeRecipient as any);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log('OpportunityFactory deployed to:', factoryAddress);
  console.log('Fee recipient set to:', formattedFeeRecipient);

  // Verify the contract on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log('Waiting for block confirmations...');
    await factory.deploymentTransaction()?.wait(6);

    await run('verify:verify', {
      address: factoryAddress,
      constructorArguments: [formattedFeeRecipient],
    });
    console.log('Contract verified on Etherscan');
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

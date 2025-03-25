import { ethers, run } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    // Get the fee recipient address from environment variables
    const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS;
    if (!feeRecipient) {
      throw new Error('FEE_RECIPIENT_ADDRESS not set in environment variables');
    }

    // Log detailed network information
    const provider = ethers.provider;
    const network = await provider.getNetwork();
    console.log('Network Details:');
    console.log('- Name:', network.name);
    console.log('- Chain ID:', network.chainId);

    // Get deployer information
    const [deployer] = await ethers.getSigners();
    const balance = await provider.getBalance(deployer.address);

    console.log('\nDeployer Information:');
    console.log('- Address:', deployer.address);
    console.log('- Balance:', ethers.formatEther(balance), 'ETH');

    // Ensure the address is properly formatted
    const formattedFeeRecipient = ethers.getAddress(feeRecipient);
    console.log('\nDeploying OpportunityFactory:');
    console.log('- Fee Recipient:', formattedFeeRecipient);

    // Estimate gas for deployment
    const OpportunityFactory = await ethers.getContractFactory(
      'OpportunityFactory'
    );

    // Deploy OpportunityFactory
    console.log('\nInitiating deployment...');
    const factory = await OpportunityFactory.deploy(formattedFeeRecipient);

    console.log('- Waiting for deployment transaction...');
    const deploymentTx = await factory.deploymentTransaction();
    if (!deploymentTx) {
      throw new Error('Deployment transaction not found');
    }

    console.log('- Transaction Hash:', deploymentTx.hash);

    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();

    console.log('\nDeployment Successful:');
    console.log('- OpportunityFactory deployed to:', factoryAddress);
    console.log('- Fee recipient set to:', formattedFeeRecipient);

    // Verify the contract on Etherscan
    if (process.env.ETHERSCAN_API_KEY) {
      console.log('\nVerifying contract on Etherscan...');
      await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds for block confirmations

      try {
        await run('verify:verify', {
          address: factoryAddress,
          constructorArguments: [formattedFeeRecipient],
        });
        console.log('Contract verified on Etherscan');
      } catch (verifyError) {
        console.error('Verification failed:', verifyError);
      }
    }
  } catch (error) {
    console.error('\n❌ Deployment Failed:');
    console.error('Error Details:', error);
    throw error;
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error('Unhandled Deployment Error:', error);
  process.exitCode = 1;
});

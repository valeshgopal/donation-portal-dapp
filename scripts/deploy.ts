import { ethers, run } from 'hardhat';

async function main() {
  // Deploy the OpportunityFactory contract
  const OpportunityFactory = await ethers.getContractFactory(
    'OpportunityFactory'
  );
  const opportunityFactory = await OpportunityFactory.deploy();
  await opportunityFactory.waitForDeployment();

  const address = await opportunityFactory.getAddress();
  console.log(`OpportunityFactory deployed to: ${address}`);

  // Verify the contract on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log('Waiting for block confirmations...');
    await opportunityFactory.deploymentTransaction()?.wait(6);

    await run('verify:verify', {
      address: address,
      constructorArguments: [],
    });
    console.log('Contract verified on Etherscan');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./DonationOpportunity.sol";

contract OpportunityFactory is Ownable {
    event OpportunityCreated(
        address indexed opportunityAddress,
        address indexed creator,
        string title,
        string metadataURI
    );

    // Mapping from opportunity address to creator address
    mapping(address => address) public opportunityToCreator;
    // Array to store all opportunity addresses
    address[] public opportunities;

    function createOpportunity(
        string memory _title,
        uint256 _fundingGoal,
        address _recipientWallet,
        string memory _metadataURI
    ) external returns (address) {
        DonationOpportunity opportunity = new DonationOpportunity(
            _title,
            _fundingGoal,
            _recipientWallet,
            msg.sender,
            _metadataURI
        );
        
        address opportunityAddress = address(opportunity);
        opportunityToCreator[opportunityAddress] = msg.sender;
        opportunities.push(opportunityAddress);
        
        emit OpportunityCreated(
            opportunityAddress,
            msg.sender,
            _title,
            _metadataURI
        );
        
        return opportunityAddress;
    }

    function getOpportunities() external view returns (address[] memory) {
        return opportunities;
    }

    function getOpportunityCreator(address _opportunity) external view returns (address) {
        return opportunityToCreator[_opportunity];
    }

    function getOpportunityCount() external view returns (uint256) {
        return opportunities.length;
    }
} 
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
    event FeeRecipientUpdated(address indexed newFeeRecipient);
    event FeeCollected(uint256 amount);
    event FeeWithdrawn(address indexed recipient, uint256 amount);

    // Mapping from opportunity address to creator address
    mapping(address => address) public opportunityToCreator;
    // Array to store all opportunity addresses
    address[] public opportunities;
    
    // Fee recipient address
    address public feeRecipient;
    // Total fees collected
    uint256 public totalFeesCollected;

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient address");
        feeRecipient = _feeRecipient;
    }

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
            _metadataURI,
            feeRecipient,
            address(this)
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

    function updateFeeRecipient(address _newFeeRecipient) external onlyOwner {
        require(_newFeeRecipient != address(0), "Invalid fee recipient address");
        feeRecipient = _newFeeRecipient;
        emit FeeRecipientUpdated(_newFeeRecipient);
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

    // Function to get total fees collected across all opportunities
    function getTotalFeesCollected() external view returns (uint256) {
        uint256 totalFees = 0;
        for (uint256 i = 0; i < opportunities.length; i++) {
            DonationOpportunity opportunity = DonationOpportunity(opportunities[i]);
            totalFees += opportunity.totalFeesCollected();
        }
        return totalFees;
    }

    // Function to receive fees from opportunities
    receive() external payable {
        if (msg.value > 0) {
            totalFeesCollected += msg.value;
            emit FeeCollected(msg.value);
        }
    }

    // Function to withdraw collected fees
    function withdrawFees() external onlyOwner {
        require(address(this).balance > 0, "No fees to withdraw");
        uint256 amount = address(this).balance;
        
        (bool success, ) = feeRecipient.call{value: amount}("");
        require(success, "Fee withdrawal failed");
        
        emit FeeWithdrawn(feeRecipient, amount);
    }
}
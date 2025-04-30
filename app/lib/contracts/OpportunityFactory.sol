// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./DonationOpportunity.sol";

contract OpportunityFactory is Ownable, Pausable, ReentrancyGuard {
    event OpportunityCreated(
        address indexed opportunityAddress,
        address indexed creator,
        string title,
        string metadataURI
    );
    event FeeRecipientUpdated(address indexed newFeeRecipient);
    event FeeCollected(uint256 amount);
    event FeeWithdrawn(address indexed recipient, uint256 amount);
    event MaxOpportunitiesUpdated(uint256 newMaxOpportunities);

    mapping(address => address) public opportunityToCreator;
    address[] public opportunities;
    
    address public feeRecipient;
    uint256 public totalFeesCollected;
    
    uint256 public maxOpportunities = 1000;
    uint256 public constant MIN_FUNDING_GOAL = 0.1 ether;

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient address");
        feeRecipient = _feeRecipient;
    }

    function createOpportunity(
        string memory _title,
        uint256 _fundingGoal,
        address _recipientWallet,
        string memory _metadataURI
    ) external whenNotPaused returns (address) {
        require(opportunities.length < maxOpportunities, "Maximum opportunities reached");
        require(bytes(_title).length > 0, "Empty title not allowed");
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        require(_recipientWallet != address(0), "Invalid recipient address");
        require(bytes(_metadataURI).length > 0, "Empty metadata not allowed");
        require(_fundingGoal >= MIN_FUNDING_GOAL, "Funding goal too low");
        
        DonationOpportunity opportunity = new DonationOpportunity(
            _title,
            _fundingGoal,
            _recipientWallet,
            msg.sender,
            _metadataURI,
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
    
    function updateMaxOpportunities(uint256 _newMaxOpportunities) external onlyOwner {
        require(_newMaxOpportunities > opportunities.length, "New max must be greater than current count");
        maxOpportunities = _newMaxOpportunities;
        emit MaxOpportunitiesUpdated(_newMaxOpportunities);
    }

    function getOpportunities() external view returns (address[] memory) {
        return opportunities;
    }
    
    function getOpportunitiesPaginated(uint256 _page, uint256 _pageSize) external view returns (address[] memory) {
        uint256 count = opportunities.length;
        
        uint256 actualPageSize = _pageSize > 100 ? 100 : _pageSize;
        uint256 startIndex = _page * actualPageSize;
        
        require(startIndex < count, "Page out of bounds");
        
        uint256 endIndex = startIndex + actualPageSize;
        if (endIndex > count) {
            endIndex = count;
        }
        
        uint256 resultSize = endIndex - startIndex;
        address[] memory result = new address[](resultSize);
        
        unchecked {
            for (uint256 i = 0; i < resultSize; i++) {
                result[i] = opportunities[startIndex + i];
            }
        }
        
        return result;
    }

    function getOpportunityCreator(address _opportunity) external view returns (address) {
        return opportunityToCreator[_opportunity];
    }

    function getOpportunityCount() external view returns (uint256) {
        return opportunities.length;
    }

    function getTotalFeesCollected() external view returns (uint256) {
        return totalFeesCollected;
    }

    receive() external payable nonReentrant {
        require(opportunityToCreator[msg.sender] != address(0), "Only donations from created campaigns allowed");
        if (msg.value > 0) {
            totalFeesCollected += msg.value;
            emit FeeCollected(msg.value);
        }
    }

    fallback() external payable {
        revert("Direct ETH transfers not allowed");
    }

    function withdrawFees() external onlyOwner nonReentrant {
        require(address(this).balance > 0, "No fees to withdraw");
        uint256 amount = address(this).balance;
        totalFeesCollected = 0;
        
        (bool success, ) = feeRecipient.call{value: amount}("");
        require(success, "Fee withdrawal failed");
        
        emit FeeWithdrawn(feeRecipient, amount);
    }
    
    function pause() external onlyOwner {
        _pause();
        emit Paused(msg.sender);
    }
    
    function unpause() external onlyOwner {
        _unpause();
        emit Unpaused(msg.sender);
    }
}
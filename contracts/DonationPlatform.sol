// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title DonationPlatform
 * @dev Main contract for handling donations with fee collection and recipient verification
 */
contract DonationPlatform is Ownable, ReentrancyGuard, Pausable {
    // Constants
    uint256 public constant FEE_DENOMINATOR = 10000; // Base for fee calculation (100% = 10000)
    uint256 public feePercentage = 500; // 5% fee (500/10000)
    
    // Structs
    struct Recipient {
        bool isVerified;
        uint256 totalReceived;
        string metadata; // IPFS hash containing recipient details
    }
    
    struct Opportunity {
        string ipfsHash;
        address recipient;
        uint256 raised;
        bool active;
    }
    
    // State variables
    mapping(address => Recipient) public recipients;
    uint256 public totalDonations;
    uint256 public totalFees;
    mapping(uint256 => Opportunity) public opportunities;
    uint256 public nextOpportunityId;
    
    // Events
    event RecipientVerified(address indexed recipient, string metadata);
    event RecipientUnverified(address indexed recipient);
    event DonationSent(
        address indexed donor,
        address indexed recipient,
        uint256 amount,
        uint256 fee
    );
    event FeePercentageUpdated(uint256 newPercentage);
    event FeeWithdrawn(address indexed owner, uint256 amount);
    event OpportunityCreated(uint256 indexed id, string ipfsHash, address recipient);
    event DonationMade(uint256 indexed id, address donor, uint256 amount);
    
    // Modifiers
    modifier onlyVerifiedRecipient(address _recipient) {
        require(recipients[_recipient].isVerified, "Recipient not verified");
        _;
    }
    
    constructor() {
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Verify a recipient and set their metadata
     * @param _recipient Address of the recipient
     * @param _metadata IPFS hash containing recipient details
     */
    function verifyRecipient(address _recipient, string calldata _metadata) external onlyOwner {
        recipients[_recipient].isVerified = true;
        recipients[_recipient].metadata = _metadata;
        emit RecipientVerified(_recipient, _metadata);
    }
    
    /**
     * @dev Unverify a recipient
     * @param _recipient Address of the recipient
     */
    function unverifyRecipient(address _recipient) external onlyOwner {
        recipients[_recipient].isVerified = false;
        emit RecipientUnverified(_recipient);
    }
    
    /**
     * @dev Update the fee percentage
     * @param _newFeePercentage New fee percentage (500 = 5%)
     */
    function updateFeePercentage(uint256 _newFeePercentage) external onlyOwner {
        require(_newFeePercentage <= 1000, "Fee cannot exceed 10%");
        feePercentage = _newFeePercentage;
        emit FeePercentageUpdated(_newFeePercentage);
    }
    
    /**
     * @dev Make a donation to a verified recipient
     * @param _recipient Address of the recipient
     */
    function donate(address _recipient) 
        external 
        payable 
        nonReentrant 
        whenNotPaused
        onlyVerifiedRecipient(_recipient) 
    {
        require(msg.value > 0, "Donation must be greater than 0");
        
        uint256 fee = (msg.value * feePercentage) / FEE_DENOMINATOR;
        uint256 donation = msg.value - fee;
        
        // Update state
        totalDonations += donation;
        totalFees += fee;
        recipients[_recipient].totalReceived += donation;
        
        // Transfer donation to recipient
        (bool success, ) = _recipient.call{value: donation}("");
        require(success, "Failed to send donation");
        
        emit DonationSent(msg.sender, _recipient, donation, fee);
    }
    
    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = totalFees;
        require(amount > 0, "No fees to withdraw");
        
        totalFees = 0;
        
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Failed to withdraw fees");
        
        emit FeeWithdrawn(owner(), amount);
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get recipient details
     * @param _recipient Address of the recipient
     */
    function getRecipient(address _recipient) external view returns (Recipient memory) {
        return recipients[_recipient];
    }

    function createOpportunity(string memory _ipfsHash) public returns (uint256) {
        uint256 id = nextOpportunityId++;
        opportunities[id] = Opportunity({
            ipfsHash: _ipfsHash,
            recipient: msg.sender,
            raised: 0,
            active: true
        });
        
        emit OpportunityCreated(id, _ipfsHash, msg.sender);
        return id;
    }

    function donate(uint256 _id) public payable {
        require(opportunities[_id].active, "Opportunity not active");
        opportunities[_id].raised += msg.value;
        
        emit DonationMade(_id, msg.sender, msg.value);
        
        // Transfer donation to recipient
        (bool sent, ) = opportunities[_id].recipient.call{value: msg.value}("");
        require(sent, "Failed to send donation");
    }

    function getOpportunity(uint256 _id) public view returns (Opportunity memory) {
        return opportunities[_id];
    }
} 
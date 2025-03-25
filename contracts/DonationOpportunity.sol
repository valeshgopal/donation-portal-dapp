// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract DonationOpportunity is ReentrancyGuard, Ownable, Pausable {
    struct UserDonation {
        uint256 amount;
        uint256 timestamp;
    }

    uint256 public constant FEE_PERCENTAGE = 500; // 5% (500/10000)
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant MAX_DONORS = 10000;
    uint256 public constant WITHDRAW_DELAY = 2 days;
    uint256 public constant MIN_DONATION = 0.0001 ether;

    string public title;
    uint256 public fundingGoal;
    uint256 public currentRaised;
    address public recipientWallet;
    address public creatorAddress;
    string public metadataURI;
    bool public active;
    uint256 public createdAt;
    uint256 public lastWithdrawRequest;
    
    address public feeRecipient;
    address public factory;
    uint256 public totalFeesCollected;

    mapping(address => UserDonation[]) public userDonations;
    address[] public donors;
    mapping(address => bool) private hasDonated;

    event DonationReceived(
        address indexed donor,
        uint256 amount,
        uint256 timestamp,
        uint256 fee
    );
    event OpportunityStatusChanged(bool active);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    event FeeTransferred(address indexed feeRecipient, uint256 amount);
    event FeeRecipientUpdated(address indexed newFeeRecipient);

    modifier onlyCreator() {
        require(msg.sender == creatorAddress, "Only creator can call this");
        _;
    }

    constructor(
        string memory _title,
        uint256 _fundingGoal,
        address _recipientWallet,
        address _creatorAddress,
        string memory _metadataURI,
        address _feeRecipient,
        address _factory
    ) {
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        require(_recipientWallet != address(0), "Invalid recipient address");
        require(_creatorAddress != address(0), "Invalid creator address");
        require(_feeRecipient != address(0), "Invalid fee recipient address");
        require(_factory != address(0), "Invalid factory address");
        require(bytes(_title).length > 0, "Title cannot be empty");

        title = _title;
        fundingGoal = _fundingGoal;
        recipientWallet = _recipientWallet;
        creatorAddress = _creatorAddress;
        metadataURI = _metadataURI;
        feeRecipient = _feeRecipient;
        factory = _factory;
        active = true;
        createdAt = block.timestamp;
        
        _transferOwnership(_creatorAddress);
    }

    function donate() external payable nonReentrant whenNotPaused {
        require(active, "Opportunity is not active");
        require(msg.value >= MIN_DONATION, "Donation amount too small");

        // Calculate fee (5%)
        uint256 fee = (msg.value * FEE_PERCENTAGE) / FEE_DENOMINATOR;
        uint256 recipientAmount = msg.value - fee;

        currentRaised += msg.value;
        totalFeesCollected += fee;

        userDonations[msg.sender].push(UserDonation({
            amount: msg.value,
            timestamp: block.timestamp
        }));

        if (!hasDonated[msg.sender]) {
            require(donors.length < MAX_DONORS, "Maximum number of unique donors reached");
            hasDonated[msg.sender] = true;
            donors.push(msg.sender);
        }

        // Send fee to factory contract AFTER state updates
        (bool feeSuccess, ) = address(factory).call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");
        emit FeeTransferred(factory, fee);

        // Send remaining amount to recipient AFTER state updates
        (bool recipientSuccess, ) = recipientWallet.call{value: recipientAmount}("");
        require(recipientSuccess, "Recipient transfer failed");

        emit DonationReceived(msg.sender, msg.value, block.timestamp, fee);
    }

    function updateFeeRecipient(address _newFeeRecipient) external onlyOwner {
        require(_newFeeRecipient != address(0), "Invalid fee recipient address");
        feeRecipient = _newFeeRecipient;
        emit FeeRecipientUpdated(_newFeeRecipient);
    }

    function stopOpportunity() external onlyCreator {
        require(active, "Opportunity is already inactive");
        active = false;
        emit OpportunityStatusChanged(false);
    }

    function startOpportunity() external onlyCreator {
        require(!active, "Opportunity is already active");
        active = true;
        emit OpportunityStatusChanged(true);
    }

    function requestEmergencyWithdraw() external onlyOwner {
        lastWithdrawRequest = block.timestamp;
    }   

    function emergencyWithdraw() external onlyOwner nonReentrant {
        require(block.timestamp >= lastWithdrawRequest + WITHDRAW_DELAY, "Timelock active");
        address ownerAddress = owner();
        require(ownerAddress != address(0), "Owner is zero address");

        uint256 amount = address(this).balance;
        require(amount > 0, "No funds to withdraw");
        
        (bool success, ) = ownerAddress.call{value: amount}("");
        require(success, "Emergency withdrawal failed");
        
        emit FundsWithdrawn(ownerAddress, amount);
    }

    function getUserDonations(address _user) external view returns (UserDonation[] memory) {
        return userDonations[_user];
    }

    function getDonorCount() external view returns (uint256) {
        return donors.length;
    }

    function getOpportunityDetails() external view returns (
        string memory _title,
        uint256 _fundingGoal,
        uint256 _currentRaised,
        address _recipientWallet,
        address _creatorAddress,
        string memory _metadataURI,
        bool _active,
        uint256 _createdAt,
        uint256 _donorCount,
        uint256 _totalFeesCollected,
        address _feeRecipient
    ) {
        return (
            title,
            fundingGoal,
            currentRaised,
            recipientWallet,
            creatorAddress,
            metadataURI,
            active,
            createdAt,
            donors.length,
            totalFeesCollected,
            feeRecipient
        );
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
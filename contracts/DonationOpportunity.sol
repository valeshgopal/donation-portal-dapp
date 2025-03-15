// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DonationOpportunity is ReentrancyGuard {
    struct UserDonation {
        uint256 amount;
        uint256 timestamp;
    }

    string public title;
    uint256 public fundingGoal;
    uint256 public currentRaised;
    address public recipientWallet;
    address public creatorAddress;
    string public metadataURI;
    bool public active;
    uint256 public createdAt;

    // Mapping to track donations by user
    mapping(address => UserDonation[]) public userDonations;
    // Array to store unique donor addresses
    address[] public donors;
    // Mapping to check if an address has donated
    mapping(address => bool) private hasDonated;

    event DonationReceived(
        address indexed donor,
        uint256 amount,
        uint256 timestamp
    );
    event OpportunityStatusChanged(bool active);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    modifier onlyCreator() {
        require(msg.sender == creatorAddress, "Only creator can call this");
        _;
    }

    constructor(
        string memory _title,
        uint256 _fundingGoal,
        address _recipientWallet,
        address _creatorAddress,
        string memory _metadataURI
    ) {
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        require(_recipientWallet != address(0), "Invalid recipient address");
        require(_creatorAddress != address(0), "Invalid creator address");

        title = _title;
        fundingGoal = _fundingGoal;
        recipientWallet = _recipientWallet;
        creatorAddress = _creatorAddress;
        metadataURI = _metadataURI;
        active = true;
        createdAt = block.timestamp;
    }

    function donate() external payable nonReentrant {
        require(active, "Opportunity is not active");
        require(msg.value > 0, "Donation amount must be greater than 0");

        currentRaised += msg.value;

        // Record donation
        userDonations[msg.sender].push(UserDonation({
            amount: msg.value,
            timestamp: block.timestamp
        }));

        // Add to donors list if first time
        if (!hasDonated[msg.sender]) {
            hasDonated[msg.sender] = true;
            donors.push(msg.sender);
        }

        emit DonationReceived(msg.sender, msg.value, block.timestamp);
    }

    function stopOpportunity() external onlyCreator {
        require(active, "Opportunity is already inactive");
        active = false;
        emit OpportunityStatusChanged(false);
    }

    function withdraw() external nonReentrant {
        require(msg.sender == recipientWallet, "Only recipient can withdraw");
        require(address(this).balance > 0, "No funds to withdraw");

        uint256 amount = address(this).balance;
        (bool success, ) = recipientWallet.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit FundsWithdrawn(recipientWallet, amount);
    }

    function getUserDonations(address _user) external view returns (UserDonation[] memory) {
        return userDonations[_user];
    }

    function getDonors() external view returns (address[] memory) {
        return donors;
    }

    function getDonorCount() external view returns (uint256) {
        return donors.length;
    }

    // Function to get opportunity details in one call
    function getOpportunityDetails() external view returns (
        string memory _title,
        uint256 _fundingGoal,
        uint256 _currentRaised,
        address _recipientWallet,
        address _creatorAddress,
        string memory _metadataURI,
        bool _active,
        uint256 _createdAt,
        uint256 _donorCount
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
            donors.length
        );
    }
} 
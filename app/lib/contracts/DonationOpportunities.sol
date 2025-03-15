// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DonationOpportunities {
    struct Opportunity {
        uint256 id;
        string title;
        string summary;
        string description;
        string location;
        string[] cause;
        uint256 fundingGoal;
        uint256 currentRaised;
        address payable walletAddress;
        uint256 createdAt;
        bool active;
        address creatorAddress;
        string metadataURI; // IPFS URI for additional metadata (proofs, etc.)
    }

    uint256 private nextOpportunityId = 1;
    mapping(uint256 => Opportunity) public opportunities;
    uint256[] public activeOpportunityIds;

    event OpportunityCreated(
        uint256 indexed id,
        address indexed creator,
        string title,
        uint256 fundingGoal
    );
    event OpportunityUpdated(uint256 indexed id, bool active);
    event DonationReceived(uint256 indexed id, address indexed donor, uint256 amount);

    modifier onlyCreator(uint256 _id) {
        require(
            opportunities[_id].creatorAddress == msg.sender,
            "Only the creator can modify this opportunity"
        );
        _;
    }

    modifier opportunityExists(uint256 _id) {
        require(_id > 0 && _id < nextOpportunityId, "Opportunity does not exist");
        _;
    }

    function createOpportunity(
        string memory _title,
        string memory _summary,
        string memory _description,
        string memory _location,
        string[] memory _cause,
        uint256 _fundingGoal,
        address payable _walletAddress,
        string memory _metadataURI
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        require(_walletAddress != address(0), "Invalid wallet address");

        uint256 opportunityId = nextOpportunityId++;
        
        Opportunity storage newOpportunity = opportunities[opportunityId];
        newOpportunity.id = opportunityId;
        newOpportunity.title = _title;
        newOpportunity.summary = _summary;
        newOpportunity.description = _description;
        newOpportunity.location = _location;
        newOpportunity.cause = _cause;
        newOpportunity.fundingGoal = _fundingGoal;
        newOpportunity.currentRaised = 0;
        newOpportunity.walletAddress = _walletAddress;
        newOpportunity.createdAt = block.timestamp;
        newOpportunity.active = true;
        newOpportunity.creatorAddress = msg.sender;
        newOpportunity.metadataURI = _metadataURI;

        activeOpportunityIds.push(opportunityId);

        emit OpportunityCreated(opportunityId, msg.sender, _title, _fundingGoal);
        return opportunityId;
    }

    function stopOpportunity(uint256 _id) 
        external 
        opportunityExists(_id)
        onlyCreator(_id) 
    {
        require(opportunities[_id].active, "Opportunity is already inactive");
        opportunities[_id].active = false;

        // Remove from active opportunities
        for (uint i = 0; i < activeOpportunityIds.length; i++) {
            if (activeOpportunityIds[i] == _id) {
                activeOpportunityIds[i] = activeOpportunityIds[activeOpportunityIds.length - 1];
                activeOpportunityIds.pop();
                break;
            }
        }

        emit OpportunityUpdated(_id, false);
    }

    function donate(uint256 _id) 
        external 
        payable 
        opportunityExists(_id)
    {
        Opportunity storage opportunity = opportunities[_id];
        require(opportunity.active, "Opportunity is not active");
        require(msg.value > 0, "Donation amount must be greater than 0");

        opportunity.currentRaised += msg.value;
        (bool sent, ) = opportunity.walletAddress.call{value: msg.value}("");
        require(sent, "Failed to send donation");

        emit DonationReceived(_id, msg.sender, msg.value);
    }

    function getOpportunity(uint256 _id) 
        external 
        view 
        opportunityExists(_id)
        returns (Opportunity memory) 
    {
        return opportunities[_id];
    }

    function getActiveOpportunities() external view returns (Opportunity[] memory) {
        Opportunity[] memory activeOpps = new Opportunity[](activeOpportunityIds.length);
        for (uint i = 0; i < activeOpportunityIds.length; i++) {
            activeOpps[i] = opportunities[activeOpportunityIds[i]];
        }
        return activeOpps;
    }

    function getAllOpportunities() external view returns (Opportunity[] memory) {
        Opportunity[] memory allOpps = new Opportunity[](nextOpportunityId - 1);
        for (uint256 i = 1; i < nextOpportunityId; i++) {
            allOpps[i - 1] = opportunities[i];
        }
        return allOpps;
    }
} 
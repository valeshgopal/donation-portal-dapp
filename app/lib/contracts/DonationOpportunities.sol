// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DonationOpportunities
 * @dev A contract for managing donation opportunities with improved security
 */
contract DonationOpportunities {
    // =========== State Variables ===========
    
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
    
    // Mapping to track indices in the activeOpportunityIds array for efficient removal
    mapping(uint256 => uint256) private opportunityIdToArrayIndex;
    
    // Admin address for emergency functions
    address public admin;
    
    // Maximum values to prevent DoS attacks
    uint256 public constant MAX_CAUSE_ITEMS = 10;
    uint256 public constant MAX_STRING_LENGTH = 2000; // characters
    
    // Reentrancy guard
    bool private locked;
    
    // Pending withdrawals for pull payment pattern
    mapping(address => uint256) public pendingWithdrawals;
    
    // =========== Events ===========
    
    event OpportunityCreated(
        uint256 indexed id,
        address indexed creator,
        string title,
        uint256 fundingGoal
    );
    event OpportunityUpdated(uint256 indexed id, bool active);
    event OpportunityDetailsUpdated(uint256 indexed id);
    event DonationReceived(uint256 indexed id, address indexed donor, uint256 amount);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    
    // =========== Modifiers ===========
    
    modifier nonReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }
    
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
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier validStringLength(string memory str) {
        require(bytes(str).length <= MAX_STRING_LENGTH, "String too long");
        _;
    }
    
    // =========== Constructor ===========
    
    constructor() {
        admin = msg.sender;
        locked = false;
    }
    
    // =========== Core Functions ===========
    
    /**
     * @dev Creates a new donation opportunity
     */
    function createOpportunity(
        string memory _title,
        string memory _summary,
        string memory _description,
        string memory _location,
        string[] memory _cause,
        uint256 _fundingGoal,
        address payable _walletAddress,
        string memory _metadataURI
    ) 
        external 
        validStringLength(_title)
        validStringLength(_summary)
        validStringLength(_description)
        validStringLength(_location)
        validStringLength(_metadataURI)
        returns (uint256) 
    {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        require(_walletAddress != address(0), "Invalid wallet address");
        require(_cause.length <= MAX_CAUSE_ITEMS, "Too many cause items");
        
        // Validate cause string lengths
        for (uint i = 0; i < _cause.length; i++) {
            require(bytes(_cause[i]).length <= MAX_STRING_LENGTH, "Cause string too long");
        }
        
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
        
        // Store the index in the array for efficient removal later
        opportunityIdToArrayIndex[opportunityId] = activeOpportunityIds.length;
        activeOpportunityIds.push(opportunityId);
        
        emit OpportunityCreated(opportunityId, msg.sender, _title, _fundingGoal);
        return opportunityId;
    }
    
    /**
     * @dev Updates an existing opportunity's details
     */
    function updateOpportunityDetails(
        uint256 _id,
        string memory _title,
        string memory _summary,
        string memory _description,
        string memory _location,
        string memory _metadataURI
    ) 
        external
        opportunityExists(_id)
        onlyCreator(_id)
        validStringLength(_title)
        validStringLength(_summary)
        validStringLength(_description)
        validStringLength(_location)
        validStringLength(_metadataURI)
    {
        require(bytes(_title).length > 0, "Title cannot be empty");
        
        Opportunity storage opportunity = opportunities[_id];
        opportunity.title = _title;
        opportunity.summary = _summary;
        opportunity.description = _description;
        opportunity.location = _location;
        opportunity.metadataURI = _metadataURI;
        
        emit OpportunityDetailsUpdated(_id);
    }
    
    /**
     * @dev Deactivates a donation opportunity
     */
    function stopOpportunity(uint256 _id) 
        external 
        opportunityExists(_id)
        onlyCreator(_id) 
    {
        require(opportunities[_id].active, "Opportunity is already inactive");
        opportunities[_id].active = false;
        
        // Remove from active opportunities using the stored index
        uint256 indexToRemove = opportunityIdToArrayIndex[_id];
        uint256 lastIndex = activeOpportunityIds.length - 1;
        
        if (indexToRemove != lastIndex) {
            uint256 lastOpportunityId = activeOpportunityIds[lastIndex];
            activeOpportunityIds[indexToRemove] = lastOpportunityId;
            opportunityIdToArrayIndex[lastOpportunityId] = indexToRemove;
        }
        
        activeOpportunityIds.pop();
        delete opportunityIdToArrayIndex[_id];
        
        emit OpportunityUpdated(_id, false);
    }
    
    /**
     * @dev Donate to an opportunity using pull payment pattern
     */
    function donate(uint256 _id) 
        external 
        payable 
        nonReentrant
        opportunityExists(_id)
    {
        Opportunity storage opportunity = opportunities[_id];
        require(opportunity.active, "Opportunity is not active");
        require(msg.value > 0, "Donation amount must be greater than 0");
        
        // Check if this donation would exceed the funding goal
        uint256 newTotal = opportunity.currentRaised + msg.value;
        
        // Update state before external interactions (Checks-Effects-Interactions pattern)
        opportunity.currentRaised = newTotal;
        pendingWithdrawals[opportunity.walletAddress] += msg.value;
        
        emit DonationReceived(_id, msg.sender, msg.value);
        
        // Auto-deactivate if funding goal is reached
        if (newTotal >= opportunity.fundingGoal && opportunity.active) {
            opportunity.active = false;
            
            // Remove from active opportunities
            uint256 indexToRemove = opportunityIdToArrayIndex[_id];
            uint256 lastIndex = activeOpportunityIds.length - 1;
            
            if (indexToRemove != lastIndex) {
                uint256 lastOpportunityId = activeOpportunityIds[lastIndex];
                activeOpportunityIds[indexToRemove] = lastOpportunityId;
                opportunityIdToArrayIndex[lastOpportunityId] = indexToRemove;
            }
            
            activeOpportunityIds.pop();
            delete opportunityIdToArrayIndex[_id];
            
            emit OpportunityUpdated(_id, false);
        }
    }
    
    /**
     * @dev Withdraw donated funds (pull payment pattern)
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        // Update state before transfer
        pendingWithdrawals[msg.sender] = 0;
        
        // Transfer funds
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(msg.sender, amount);
    }
    
    // =========== View Functions ===========
    
    /**
     * @dev Get details of a specific opportunity
     */
    function getOpportunity(uint256 _id) 
        external 
        view 
        opportunityExists(_id)
        returns (Opportunity memory) 
    {
        return opportunities[_id];
    }
    
    /**
     * @dev Get all active opportunities
     */
    function getActiveOpportunities() external view returns (Opportunity[] memory) {
        Opportunity[] memory activeOpps = new Opportunity[](activeOpportunityIds.length);
        for (uint i = 0; i < activeOpportunityIds.length; i++) {
            activeOpps[i] = opportunities[activeOpportunityIds[i]];
        }
        return activeOpps;
    }
    
    /**
     * @dev Get all opportunities
     */
    function getAllOpportunities() external view returns (Opportunity[] memory) {
        Opportunity[] memory allOpps = new Opportunity[](nextOpportunityId - 1);
        for (uint256 i = 1; i < nextOpportunityId; i++) {
            allOpps[i - 1] = opportunities[i];
        }
        return allOpps;
    }
    
    // =========== Admin Functions ===========
    
    /**
     * @dev Change admin address
     */
    function changeAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid admin address");
        address oldAdmin = admin;
        admin = _newAdmin;
        emit AdminChanged(oldAdmin, _newAdmin);
    }
    
    /**
     * @dev Emergency stop an opportunity (admin only)
     */
    function emergencyStopOpportunity(uint256 _id) 
        external 
        onlyAdmin
        opportunityExists(_id)
    {
        require(opportunities[_id].active, "Opportunity is already inactive");
        opportunities[_id].active = false;
        
        // Remove from active opportunities
        uint256 indexToRemove = opportunityIdToArrayIndex[_id];
        uint256 lastIndex = activeOpportunityIds.length - 1;
        
        if (indexToRemove != lastIndex) {
            uint256 lastOpportunityId = activeOpportunityIds[lastIndex];
            activeOpportunityIds[indexToRemove] = lastOpportunityId;
            opportunityIdToArrayIndex[lastOpportunityId] = indexToRemove;
        }
        
        activeOpportunityIds.pop();
        delete opportunityIdToArrayIndex[_id];
        
        emit OpportunityUpdated(_id, false);
    }
}
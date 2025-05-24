// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol"; // Untuk konversi uint ke string jika diperlukan untuk event
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // Interface untuk ERC20
import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; // Untuk keamanan tambahan

contract IdeaFund is ReentrancyGuard {
    struct Campaign {
        address payable owner; // Alamat pemilik proyek (yang bisa menerima dana)
        string projectId;      // ID Proyek dari backend (UUID)
        string title;
        uint256 targetAmount;   // Target dana dalam unit terkecil token (misal, USDT dengan 6 desimal)
        uint256 raisedAmount;   // Dana terkumpul dalam unit terkecil token
        uint256 deadline;       // Batas waktu penggalangan dana (Unix timestamp)
        bool exists;           // Apakah kampanye ini ada/valid
        bool claimed;          // Apakah dana sudah diklaim oleh pemilik
        address[] donators;
        mapping(address => uint256) donations;
    }

    mapping(string => Campaign) public campaigns; // Mapping projectId (UUID) ke Campaign

    IERC20 public usdtToken; // Variabel untuk menyimpan instance kontrak token USDT

    constructor(address _usdtTokenAddress) {
        usdtToken = IERC20(_usdtTokenAddress);
    }

    event CampaignCreated(
        string indexed projectId,
        address indexed owner,
        string title,
        uint256 targetAmount,
        uint256 deadline
    );

    event Donated(
        string indexed projectId,
        address indexed donor,
        uint256 amountToken // Jumlah token yang didonasikan
    );

    event FundsClaimed(
        string indexed projectId,
        address indexed owner,
        uint256 amountClaimed
    );

    modifier onlyCampaignOwner(string calldata _projectId) {
        require(campaigns[_projectId].exists, "Campaign does not exist.");
        require(campaigns[_projectId].owner == msg.sender, "Caller is not the campaign owner.");
        _;
    }

    modifier campaignMustExist(string calldata _projectId) {
        require(campaigns[_projectId].exists, "Campaign does not exist.");
        _;
    }

    /**
     * @dev Membuat kampanye baru di blockchain.
     * @param _projectId ID unik proyek dari sistem backend (UUID).
     * @param _title Judul proyek.
     * @param _targetAmount Target dana yang ingin dikumpulkan (dalam WEI).
     * @param _durationDays Durasi penggalangan dana dalam hari.
     */
    function createCampaign(
        string calldata _projectId,
        string calldata _title,
        uint256 _targetAmount,
        uint256 _durationDays // Durasi dalam hari
    ) public {
        require(!campaigns[_projectId].exists, "Campaign with this ID already exists.");
        require(_targetAmount > 0, "Target amount must be greater than 0.");
        require(_durationDays > 0, "Duration must be greater than 0 days.");

        uint256 campaignDeadline = block.timestamp + (_durationDays * 1 days);

        Campaign storage newCampaign = campaigns[_projectId];
        newCampaign.owner = payable(msg.sender);
        newCampaign.projectId = _projectId;
        newCampaign.title = _title;
        newCampaign.targetAmount = _targetAmount;
        newCampaign.raisedAmount = 0;
        newCampaign.deadline = campaignDeadline;
        newCampaign.exists = true;
        newCampaign.claimed = false;
        // newCampaign.donators diinisialisasi secara default sebagai array kosong
        // newCampaign.donations (mapping) juga diinisialisasi secara default

        emit CampaignCreated(
            _projectId,
            msg.sender,
            _title,
            _targetAmount,
            campaignDeadline
        );
    }

    /**
     * @dev Mengirim donasi ke sebuah kampanye.
     * @param _projectId ID proyek yang akan didonasi.
     * @param _amount Jumlah token USDT (dalam unit terkecilnya) yang akan didonasikan.
     */
    function donateToCampaign(string calldata _projectId, uint256 _amount) public nonReentrant campaignMustExist(_projectId) {
        Campaign storage campaign = campaigns[_projectId];
        require(block.timestamp < campaign.deadline, "Campaign deadline has passed.");
        require(_amount > 0, "Donation amount must be greater than 0.");

        // Pindahkan token USDT dari donatur ke kontrak ini
        // Donatur harus sudah memanggil `approve` pada kontrak USDT sebelumnya
        // untuk mengizinkan kontrak IdeaFund ini menarik `_amount` token.
        uint256 initialBalance = usdtToken.balanceOf(address(this));
        usdtToken.transferFrom(msg.sender, address(this), _amount);
        require(usdtToken.balanceOf(address(this)) == initialBalance + _amount, "Token transfer failed");

        if (campaign.donations[msg.sender] == 0) {
            campaign.donators.push(msg.sender);
        }
        campaign.donations[msg.sender] += _amount;
        campaign.raisedAmount += _amount;

        emit Donated(_projectId, msg.sender, _amount);
    }

    /**
     * @dev Pemilik kampanye mengklaim dana yang terkumpul.
     * @param _projectId ID proyek yang dananya akan diklaim.
     */
    function claimFunds(string calldata _projectId) public nonReentrant onlyCampaignOwner(_projectId) {
        Campaign storage campaign = campaigns[_projectId];
        require(!campaign.claimed, "Funds have already been claimed.");
        require(campaign.raisedAmount >= campaign.targetAmount, "Campaign target not reached.");

        uint256 amountToClaim = campaign.raisedAmount;
        campaign.claimed = true; 

        // Transfer token USDT yang terkumpul ke pemilik proyek
        usdtToken.transfer(campaign.owner, amountToClaim);

        emit FundsClaimed(_projectId, campaign.owner, amountToClaim);
    }

    // --- Getter Functions ---
    function getCampaignDetails(string calldata _projectId)
        public
        view
        campaignMustExist(_projectId)
        returns (
            address owner,
            string memory title,
            uint256 targetAmount,
            uint256 raisedAmount,
            uint256 deadline,
            bool claimed
        )
    {
        Campaign storage c = campaigns[_projectId];
        return (
            c.owner,
            c.title,
            c.targetAmount,
            c.raisedAmount,
            c.deadline,
            c.claimed
        );
    }

    function getDonators(string calldata _projectId) public view campaignMustExist(_projectId) returns (address[] memory) {
        return campaigns[_projectId].donators;
    }

    function getDonationAmountByDonator(string calldata _projectId, address _donator) public view campaignMustExist(_projectId) returns (uint256) {
        return campaigns[_projectId].donations[_donator];
    }

    // Opsional: Fungsi paginasi untuk donatur jika diperlukan
    function getDonatorsPaginated(string calldata _projectId, uint256 _startIndex, uint256 _pageSize) 
        public 
        view 
        campaignMustExist(_projectId) 
        returns (address[] memory, uint256 newStartIndex) 
    {
        address[] storage donatorArray = campaigns[_projectId].donators;
        uint256 len = donatorArray.length;

        if (_startIndex >= len) {
            return (new address[](0), len);
        }

        uint256 endIndex = _startIndex + _pageSize;
        if (endIndex > len) {
            endIndex = len;
        }

        address[] memory page = new address[](endIndex - _startIndex);
        for (uint256 i = 0; i < page.length; i++) {
            page[i] = donatorArray[_startIndex + i];
        }
        return (page, endIndex);
    }
}

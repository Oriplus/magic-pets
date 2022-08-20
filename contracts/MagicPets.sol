// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MagicPets is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    AccessControl
{
    using Counters for Counters.Counter;
    struct Pet {
        string URI;
        bool onSale;
    }
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => Pet) public Pets;
    uint256 public price = 0.002 ether;
    bool public paused;
    //Wallet that will receive the funds
    address payable fundationWallet =
        payable(0x91F6754c619835A39835cc8284FBBc2f8490D8F0);
    string baseTokenURI =
        "https://gateway.pinata.cloud/ipfs/QmRCftCoJaK3LhaEKdT1msWYDSvb8RaLZN8qqm3kH9RxSe";

    constructor() ERC721("Magic Pets", "MPETS") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    modifier onlyWhenNotPaused() {
        require(!paused, "Contract currently paused");
        _;
    }

    /**
     * @dev only the  owner of the contract can mint
     * the DNFT will have an inital URI
     */
    function safeMint(string memory _uri)
        public
        onlyRole(MINTER_ROLE)
    {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        Pets[tokenId].URI = _uri;
        Pets[tokenId].onSale = true;
        _mint(address(this), tokenId);
        _setTokenURI(tokenId, baseTokenURI);
    }

    /**
     * @dev withdraw sends all the ether in the contract
     * to the owner of the contract
     */
    function buy(uint256 _tokenId) public payable onlyWhenNotPaused {
        require(Pets[_tokenId].onSale == true, "Buy Error: Pet is not for sale");
        require(msg.value == price, "Buy Error: Ether sent is not correct");
        address seller = ownerOf(_tokenId);
        _transfer(seller, msg.sender, _tokenId);
        _setTokenURI(_tokenId, Pets[_tokenId].URI);
        Pets[_tokenId].onSale = false;
    }

    /**
     * @dev revoke roles
     */
    function deleteRole(string memory _nameRole, address _account) public {
        bytes32 role = keccak256(abi.encodePacked(_nameRole));
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Delete Role: only Admin can delete roles");
        _revokeRole(role, _account);
    }

    /**
     * @dev grant roles
     */
    function addRole(string memory _nameRole, address _account) public
    {
        bytes32 role = keccak256(abi.encodePacked(_nameRole));
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Add Role: only Admin can add roles");
        require(DEFAULT_ADMIN_ROLE == role || MINTER_ROLE == role, "Add Role doesn't exist");
        _grantRole(role, _account);
    }

    /**
     * @dev withdraw sends all the ether in the contract
     * to the owner of the contract
     */
    function withdraw() public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            address(this).balance > 0,
            "Withdraw Error: Need more than 0 Eth to donate"
        );
        fundationWallet.transfer(address(this).balance);
    }

    /**
     * @dev setPaused makes the contract paused or unpaused
     */
    function setPaused(bool _val) public onlyRole(DEFAULT_ADMIN_ROLE) {
        paused = _val;
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

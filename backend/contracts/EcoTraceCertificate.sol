// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EcoTraceCertificate
 * @notice ERC721 NFT representing an eco-friendly certification for highland vegetables.
 * @dev Each certificate stores a dataHash (SHA-256 of farm record JSON) on-chain
 *      for tamper-proof verification without storing full data on-chain.
 *
 *      Deployed on Polygon Amoy testnet (chainId: 80002).
 */
contract EcoTraceCertificate is ERC721URIStorage, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 private _nextTokenId;

    // Mapping from tokenId to certificate data hash
    mapping(uint256 => bytes32) private _dataHashes;

    // Mapping from tokenId to mint timestamp
    mapping(uint256 => uint256) private _mintedAt;

    // Mapping from tokenId to revocation status
    mapping(uint256 => bool) private _revoked;

    // ─── Events ────────────────────────────────────────────────────────────

    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed farmer,
        bytes32 dataHash,
        uint256 timestamp
    );

    event CertificateRevoked(
        uint256 indexed tokenId,
        string reason
    );

    // ─── Constructor ───────────────────────────────────────────────────────

    constructor(address defaultAdmin, address minter) ERC721("EcoTrace Certificate", "ECOT") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
        _nextTokenId = 1;
    }

    // ─── Minting ───────────────────────────────────────────────────────────

    /**
     * @notice Mint a new eco-certificate NFT.
     * @param to The recipient (farmer) address.
     * @param uri IPFS metadata URI for the certificate.
     * @param dataHash SHA-256 hash of the farm record data for on-chain verification.
     * @return tokenId The newly minted token ID.
     */
    function mintCertificate(
        address to,
        string calldata uri,
        bytes32 dataHash
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(to != address(0), "EcoTrace: mint to zero address");
        require(dataHash != bytes32(0), "EcoTrace: empty data hash");

        uint256 tokenId = _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        _dataHashes[tokenId] = dataHash;
        _mintedAt[tokenId] = block.timestamp;

        emit CertificateMinted(tokenId, to, dataHash, block.timestamp);

        return tokenId;
    }

    // ─── Verification ──────────────────────────────────────────────────────

    /**
     * @notice Verify a certificate by its token ID.
     * @param tokenId The NFT token ID to verify.
     * @return uri The token metadata URI.
     * @return dataHash The on-chain data hash.
     * @return mintedAt The timestamp when the certificate was minted.
     */
    function verifyCertificate(uint256 tokenId)
        external
        view
        returns (string memory uri, bytes32 dataHash, uint256 mintedAt)
    {
        // _requireOwned reverts if token doesn't exist
        _requireOwned(tokenId);

        require(!_revoked[tokenId], "EcoTrace: certificate revoked");

        return (
            tokenURI(tokenId),
            _dataHashes[tokenId],
            _mintedAt[tokenId]
        );
    }

    /**
     * @notice Check if a certificate is valid (exists and not revoked).
     * @param tokenId The token ID to check.
     * @return True if the certificate is valid.
     */
    function isValid(uint256 tokenId) external view returns (bool) {
        try this.ownerOf(tokenId) returns (address) {
            return !_revoked[tokenId];
        } catch {
            return false;
        }
    }

    // ─── Revocation ────────────────────────────────────────────────────────

    /**
     * @notice Revoke a certificate (admin only).
     * @param tokenId The token to revoke.
     * @param reason Human-readable reason for revocation.
     */
    function revokeCertificate(uint256 tokenId, string calldata reason)
        external
        onlyRole(ADMIN_ROLE)
    {
        _requireOwned(tokenId);
        require(!_revoked[tokenId], "EcoTrace: already revoked");

        _revoked[tokenId] = true;

        emit CertificateRevoked(tokenId, reason);
    }

    // ─── Admin Functions ───────────────────────────────────────────────────

    /**
     * @notice Pause all minting operations (emergency stop).
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause minting operations.
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Get the total number of certificates minted.
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // ─── Interface Support ─────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

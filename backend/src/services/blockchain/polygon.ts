import { ethers } from 'ethers';
import { env } from '../../config/env';

/**
 * Result of a successful NFT mint transaction.
 */
export interface MintResult {
  txHash: string;
  tokenId: string;
  contractAddress: string;
  chainId: number;
}

// Minimal ABI for the Tani Tinggi certification contract
const CONTRACT_ABI = [
  'function mintCertificate(address to, string memory dataHash, string memory metadataUri) public returns (uint256)',
  'event CertificateMinted(uint256 indexed tokenId, address indexed to, string dataHash)',
];

/**
 * Get a configured provider and wallet for Polygon interactions.
 */
function getProviderAndWallet(): { provider: ethers.JsonRpcProvider; wallet: ethers.Wallet } {
  if (!env.POLYGON_PRIVATE_KEY) {
    throw new Error('POLYGON_PRIVATE_KEY is not configured');
  }
  if (!env.CONTRACT_ADDRESS) {
    throw new Error('CONTRACT_ADDRESS is not configured');
  }

  const provider = new ethers.JsonRpcProvider(env.POLYGON_RPC_URL, {
    name: 'polygon-amoy',
    chainId: env.CHAIN_ID,
  });

  const wallet = new ethers.Wallet(env.POLYGON_PRIVATE_KEY, provider);
  return { provider, wallet };
}

/**
 * Mint an eco-certification NFT on the Polygon network.
 *
 * @param recipientAddress - Wallet address to receive the NFT
 * @param dataHash - SHA-256 hash of the certificate data (on-chain integrity)
 * @param metadataUri - IPFS or HTTP URI for the NFT metadata JSON
 * @returns Mint result with txHash, tokenId, and chain details
 */
export async function mintCertificate(
  recipientAddress: string,
  dataHash: string,
  metadataUri: string,
): Promise<MintResult> {
  const { wallet } = getProviderAndWallet();

  const contract = new ethers.Contract(env.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  const tx = await contract.mintCertificate(recipientAddress, dataHash, metadataUri);
  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error(`Mint transaction failed: ${tx.hash}`);
  }

  // Parse the CertificateMinted event to get the tokenId
  const mintEvent = receipt.logs
    .map((log: ethers.Log) => {
      try {
        return contract.interface.parseLog({ topics: [...log.topics], data: log.data });
      } catch {
        return null;
      }
    })
    .find((parsed: ethers.LogDescription | null) => parsed?.name === 'CertificateMinted');

  const tokenId = mintEvent ? mintEvent.args[0].toString() : '0';

  return {
    txHash: receipt.hash,
    tokenId,
    contractAddress: env.CONTRACT_ADDRESS,
    chainId: env.CHAIN_ID,
  };
}

/**
 * Verify that the blockchain configuration is valid and the wallet has funds.
 */
export async function checkBlockchainHealth(): Promise<boolean> {
  try {
    if (!env.POLYGON_PRIVATE_KEY || !env.CONTRACT_ADDRESS) {
      return false;
    }

    const { provider, wallet } = getProviderAndWallet();
    const balance = await provider.getBalance(wallet.address);
    return balance > 0n;
  } catch {
    return false;
  }
}

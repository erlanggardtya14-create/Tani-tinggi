import { ethers } from 'ethers';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

let provider: ethers.JsonRpcProvider | null = null;
let wallet: ethers.Wallet | null = null;
let contract: ethers.Contract | null = null;

export function initBlockchain(): void {
  try {
    if (!env.POLYGON_PRIVATE_KEY || env.POLYGON_PRIVATE_KEY === 'your_wallet_private_key_here' || !env.CONTRACT_ADDRESS) {
      logger.warn('Blockchain credentials not set. Using mock blockchain data.');
      return;
    }
    provider = new ethers.JsonRpcProvider(env.POLYGON_RPC_URL);
    wallet = new ethers.Wallet(env.POLYGON_PRIVATE_KEY, provider);
    
    const abiPath = path.resolve(__dirname, 'contract-abi.json');
    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
    
    contract = new ethers.Contract(env.CONTRACT_ADDRESS, abi, wallet);
  } catch (err) {
    logger.error({ err }, 'Failed to initialize blockchain provider');
  }
}

export async function mintCertificate(recipientAddress: string, metadataUri: string, dataHash: string): Promise<{ txHash: string; tokenId: string }> {
  if (!contract) {
    logger.info('Mock minting certificate...');
    return {
      txHash: `0xmocktxhash${Date.now()}`,
      tokenId: `${Date.now() % 1000000}`,
    };
  }

  try {
    const tx = await contract.mintCertificate(recipientAddress, metadataUri, dataHash);
    const receipt = await tx.wait();
    
    // Find CertificateMinted event
    const event = receipt?.logs.find((log: any) => {
      try {
        const parsed = contract?.interface.parseLog(log);
        return parsed?.name === 'CertificateMinted';
      } catch {
        return false;
      }
    });

    let tokenId = 'unknown';
    if (event) {
      const parsedLog = contract.interface.parseLog(event);
      tokenId = parsedLog?.args[0].toString() || 'unknown';
    }

    return { txHash: tx.hash, tokenId };
  } catch (error) {
    logger.error({ error }, 'Failed to mint certificate');
    throw error;
  }
}

export async function verifyCertificate(tokenId: string): Promise<{ uri: string; dataHash: string; mintedAt: number }> {
  if (!contract) {
    return {
      uri: 'ipfs://mock-uri',
      dataHash: '0xmockdatahash',
      mintedAt: Math.floor(Date.now() / 1000),
    };
  }

  try {
    const [uri, dataHash, mintedAt] = await contract.verifyCertificate(tokenId);
    return { uri, dataHash, mintedAt: Number(mintedAt) };
  } catch (error) {
    logger.error({ error, tokenId }, 'Failed to verify certificate');
    throw error;
  }
}

export async function verifyTransaction(txHash: string): Promise<boolean> {
  if (!provider) return true; // mock success
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    return receipt !== null && receipt.status === 1;
  } catch (error) {
    return false;
  }
}

export async function getBlockchainHealth(): Promise<boolean> {
  if (!provider) return true; // mock healthy
  try {
    const network = await provider.getNetwork();
    return network.chainId === BigInt(env.CHAIN_ID);
  } catch (error) {
    return false;
  }
}

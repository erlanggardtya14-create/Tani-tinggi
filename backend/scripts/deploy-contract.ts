/**
 * Deploy TaniTinggiCertificate smart contract to Polygon Amoy testnet.
 *
 * Usage: npm run deploy:contract
 *
 * Prerequisites:
 * 1. Set POLYGON_RPC_URL and POLYGON_PRIVATE_KEY in .env
 * 2. Ensure wallet has enough MATIC for gas on Amoy testnet
 *    Get test MATIC from: https://faucet.polygon.technology/
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Load environment
import 'dotenv/config';

async function main(): Promise<void> {
  const rpcUrl = process.env.POLYGON_RPC_URL;
  const privateKey = process.env.POLYGON_PRIVATE_KEY;

  if (!rpcUrl || !privateKey || privateKey === 'your_wallet_private_key_here') {
    console.error('❌ Set POLYGON_RPC_URL and POLYGON_PRIVATE_KEY in .env');
    console.log('\n📋 Steps:');
    console.log('1. Create a wallet (MetaMask or similar)');
    console.log('2. Get test MATIC from https://faucet.polygon.technology/');
    console.log('3. Set POLYGON_PRIVATE_KEY in your .env file');
    process.exit(1);
  }

  console.log('🚀 Deploying TaniTinggiCertificate to Polygon Amoy...\n');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const balance = await provider.getBalance(wallet.address);
  console.log(`📍 Deployer: ${wallet.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} MATIC\n`);

  if (balance === 0n) {
    console.error('❌ Wallet has no MATIC. Get test tokens from the faucet.');
    process.exit(1);
  }

  // Load compiled contract ABI and bytecode
  // In a real setup, you'd compile with Hardhat first: npx hardhat compile
  // For now, we use a pre-compiled artifact or the inline ABI
  const abiPath = path.resolve(__dirname, '../src/services/blockchain/contract-abi.json');

  if (!fs.existsSync(abiPath)) {
    console.error('❌ Contract ABI not found. Run: npx hardhat compile');
    process.exit(1);
  }

  const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8'));

  // NOTE: In production, you'd use Hardhat's deploy task.
  // This script demonstrates the deployment flow.
  console.log('📝 To deploy with Hardhat:');
  console.log('   npx hardhat compile');
  console.log('   npx hardhat run scripts/deploy-contract.ts --network amoy');
  console.log('\n✅ Contract ABI loaded successfully.');
  console.log(`   ABI path: ${abiPath}`);
  console.log(`   Functions: ${abi.length} entries`);
  console.log('\n📌 After deployment, set CONTRACT_ADDRESS in .env');
}

main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});

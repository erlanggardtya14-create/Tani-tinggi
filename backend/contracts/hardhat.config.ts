import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

/**
 * Hardhat config for Tani Tinggi smart contract development.
 * Targets Polygon Amoy testnet (chainId: 80002).
 */
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: 'paris',
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    amoy: {
      url: process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology',
      accounts: process.env.POLYGON_PRIVATE_KEY ? [process.env.POLYGON_PRIVATE_KEY] : [],
      chainId: 80002,
    },
  },
  paths: {
    sources: './contracts',
    tests: './tests/contracts',
    cache: './cache',
    artifacts: './artifacts',
  },
};

export default config;

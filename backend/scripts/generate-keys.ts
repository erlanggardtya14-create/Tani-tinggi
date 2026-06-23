/**
 * Generate RSA key pair for JWT RS256 authentication.
 *
 * Usage: npm run generate:keys
 *
 * Generates:
 *   keys/private.pem — RSA private key (keep SECRET)
 *   keys/public.pem  — RSA public key (can be shared)
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

function generateKeys(): void {
  const keysDir = path.resolve(__dirname, '../keys');

  // Create keys directory
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
    console.log(`📁 Created directory: ${keysDir}`);
  }

  const privatePath = path.join(keysDir, 'private.pem');
  const publicPath = path.join(keysDir, 'public.pem');

  // Check if keys already exist
  if (fs.existsSync(privatePath) && fs.existsSync(publicPath)) {
    console.log('⚠️  Keys already exist. Delete them first to regenerate.');
    console.log(`   Private: ${privatePath}`);
    console.log(`   Public:  ${publicPath}`);
    return;
  }

  console.log('🔐 Generating RSA-2048 key pair...\n');

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  fs.writeFileSync(privatePath, privateKey, { mode: 0o600 }); // Owner read/write only
  fs.writeFileSync(publicPath, publicKey, { mode: 0o644 });

  console.log('✅ RSA keys generated successfully!\n');
  console.log(`   🔑 Private key: ${privatePath}`);
  console.log(`   📋 Public key:  ${publicPath}`);
  console.log('\n⚠️  IMPORTANT: Never commit private.pem to version control!');
  console.log('   Make sure "keys/" is in your .gitignore.');
}

generateKeys();

import * as crypto from 'crypto';

export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function sha256Buffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function verifyHash(data: string, expectedHash: string): boolean {
  return sha256(data) === expectedHash;
}

export function generateDataHash(record: object): string {
  const jsonString = JSON.stringify(record);
  const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
  return `0x${hash}`;
}

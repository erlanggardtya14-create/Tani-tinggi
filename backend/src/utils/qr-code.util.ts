import QRCode from 'qrcode';
import * as jwt from 'jsonwebtoken';
import { env, loadJwtKeys, isDev } from '../config/env';
import { QrCertificatePayload } from '../types';

const keys = loadJwtKeys();

export async function generateQrCode(payload: QrCertificatePayload): Promise<{ qrBuffer: Buffer; qrData: string }> {
  let qrData: string;
  if (keys) {
    qrData = jwt.sign(payload, keys.privateKey, { algorithm: 'RS256' });
  } else {
    qrData = jwt.sign(payload, 'tanitinggi-dev-secret');
  }

  const qrUri = `tanitinggi://verify?token=${qrData}`;
  const qrBuffer = await QRCode.toBuffer(qrUri, {
    type: 'png',
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    width: 400,
  });

  return { qrBuffer, qrData };
}

export function decodeQrToken(token: string): QrCertificatePayload {
  if (keys) {
    return jwt.verify(token, keys.publicKey, { algorithms: ['RS256'] }) as QrCertificatePayload;
  } else {
    return jwt.verify(token, 'tanitinggi-dev-secret') as QrCertificatePayload;
  }
}

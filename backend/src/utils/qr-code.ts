import QRCode from 'qrcode';
import type { QrCertificatePayload } from '../types';

/**
 * Generate a QR code PNG buffer from certificate data.
 *
 * The QR contains a JSON string with certificate verification info
 * that can be scanned by buyers or inspectors.
 *
 * @param payload - Certificate data to encode
 * @returns PNG image buffer
 */
export async function generateQrCode(payload: QrCertificatePayload): Promise<Buffer> {
  const jsonPayload = JSON.stringify(payload);

  const buffer = await QRCode.toBuffer(jsonPayload, {
    type: 'png',
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'H', // High error correction for field scanning
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
  });

  return buffer;
}

/**
 * Generate a QR code as a data URL string (for embedding in responses).
 */
export async function generateQrDataUrl(payload: QrCertificatePayload): Promise<string> {
  const jsonPayload = JSON.stringify(payload);

  return QRCode.toDataURL(jsonPayload, {
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
  });
}

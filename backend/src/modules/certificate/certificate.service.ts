import { prisma } from '../../config/database';
import { decodeQrToken } from '../../utils/qr-code.util';
import { verifyTransaction } from '../../services/blockchain/polygon.service';
import { blockchainMintQueue } from '../../jobs/queue';

export class CertificateService {
  async verifyByQrToken(qrToken: string) {
    const payload = decodeQrToken(qrToken);
    
    const certificate = await prisma.certificate.findUnique({
      where: { id: payload.certId },
      include: {
         farmRecord: {
            include: { farmer: true, carbonScore: true, deliveryInfo: true }
         }
      }
    });

    if (!certificate) throw Object.assign(new Error('Certificate not found'), { statusCode: 404 });
    
    let isTxValid = false;
    if (certificate.txHash) {
       isTxValid = await verifyTransaction(certificate.txHash);
    }

    return {
      certificate,
      blockchainVerification: {
        isValid: isTxValid,
        txHash: certificate.txHash,
        contractAddress: certificate.contractAddress,
        chainId: certificate.chainId
      }
    };
  }

  async getById(id: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { farmRecord: true }
    });
    if (!certificate) throw Object.assign(new Error('Certificate not found'), { statusCode: 404 });
    return certificate;
  }

  async verifyOnBlockchain(txHash: string) {
    const isValid = await verifyTransaction(txHash);
    return { txHash, isValid };
  }

  async retryMinting(recordId: string) {
    const record = await prisma.farmRecord.findUnique({ where: { id: recordId } });
    if (!record) throw Object.assign(new Error('Record not found'), { statusCode: 404 });
    
    if (record.status !== 'FAILED') {
        throw Object.assign(new Error('Only FAILED records can be retried'), { statusCode: 400 });
    }

    await prisma.farmRecord.update({
        where: { id: recordId },
        data: { status: 'CERTIFYING' }
    });

    await blockchainMintQueue.add('mint-certificate', { farmRecordId: recordId });
    return { message: 'Minting retried', recordId };
  }
}

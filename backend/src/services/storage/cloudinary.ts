import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../../config/env';

/**
 * Configure Cloudinary SDK. Must be called before any upload.
 */
function ensureConfigured(): void {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
}

/**
 * Upload a buffer (e.g. QR code PNG) to Cloudinary.
 *
 * @param buffer - Image buffer to upload
 * @param folder - Subfolder within the configured Cloudinary folder
 * @param publicId - Optional public ID for the uploaded asset
 * @returns Upload result with URLs
 */
export async function uploadBuffer(
  buffer: Buffer,
  folder: string,
  publicId?: string,
): Promise<UploadResult> {
  ensureConfigured();

  return new Promise<UploadResult>((resolve, reject) => {
    const uploadOptions: Record<string, unknown> = {
      folder: `${env.CLOUDINARY_FOLDER}/${folder}`,
      resource_type: 'image' as const,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: unknown, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload returned no result'));
          return;
        }

        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    uploadStream.end(buffer);
  });
}

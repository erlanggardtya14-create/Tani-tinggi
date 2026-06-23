import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const isCloudinaryConfigured = 
  env.CLOUDINARY_CLOUD_NAME && 
  env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  env.CLOUDINARY_API_KEY && 
  env.CLOUDINARY_API_KEY !== 'your_api_key' &&
  env.CLOUDINARY_API_SECRET && 
  env.CLOUDINARY_API_SECRET !== 'your_api_secret';

export function initCloudinary(): void {
  if (isCloudinaryConfigured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  } else {
    logger.warn('Cloudinary credentials not set or using placeholders. Using mock URLs.');
  }
}

export async function uploadImage(base64: string, folder: string = env.CLOUDINARY_FOLDER): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured) {
    return { url: 'https://res.cloudinary.com/mock/image/upload/v1/mock-image.jpg', publicId: 'mock-public-id' };
  }
  
  const uploadStr = base64.startsWith('data:image') ? base64 : `data:image/jpeg;base64,${base64}`;
  const result = await cloudinary.uploader.upload(uploadStr, { folder });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function uploadFromUrl(url: string, folder: string = env.CLOUDINARY_FOLDER): Promise<{ url: string; publicId: string }> {
    if (!isCloudinaryConfigured) {
      return { url: 'https://res.cloudinary.com/mock/image/upload/v1/mock-image.jpg', publicId: 'mock-public-id' };
    }
    const result = await cloudinary.uploader.upload(url, { folder });
    return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteImage(publicId: string): Promise<void> {
  if (isCloudinaryConfigured && publicId !== 'mock-public-id') {
    await cloudinary.uploader.destroy(publicId);
  }
}

export function getImageUrl(publicId: string, transformations?: any): string {
  if (!isCloudinaryConfigured) {
    return 'https://res.cloudinary.com/mock/image/upload/v1/mock-image.jpg';
  }
  return cloudinary.url(publicId, transformations);
}

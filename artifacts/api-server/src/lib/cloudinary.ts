import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload base64 image/document to Cloudinary
 * @param base64Data - Base64 encoded file data (without data:image/... prefix)
 * @param fileName - Original file name
 * @param mimeType - MIME type of the file
 * @param folder - Cloudinary folder path (default: 'kyc-documents')
 * @returns Cloudinary secure URL
 */
export async function uploadToCloudinary(
  base64Data: string,
  fileName: string,
  mimeType: string,
  folder: string = 'kyc-documents'
): Promise<string> {
  try {
    // Construct data URI
    const dataUri = `data:${mimeType};base64,${base64Data}`;
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'auto', // Auto-detect image/raw for PDFs
      public_id: `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      overwrite: false,
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload document to cloud storage');
  }
}

/**
 * Delete a file from Cloudinary by URL
 * @param url - Cloudinary secure URL
 */
export async function deleteFromCloudinary(url: string): Promise<void> {
  try {
    // Extract public_id from URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{ext}
    const urlParts = url.split('/');
    const fileWithExt = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    const publicId = `${folder}/${fileWithExt.split('.')[0]}`;
    
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // Don't throw - deletion failures shouldn't break the flow
  }
}

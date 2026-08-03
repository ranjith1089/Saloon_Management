import { v2 as cloudinary } from 'cloudinary';

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = !!(cloud_name && api_key && api_secret);

if (isCloudinaryConfigured) {
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
}

export default cloudinary;

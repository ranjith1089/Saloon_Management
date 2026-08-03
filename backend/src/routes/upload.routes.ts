import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { BadRequestError } from '../utils/ApiError';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary';

const router = Router();

// Store the file in memory — we stream it directly to Cloudinary and never
// touch disk. Keeps the container ephemeral-friendly.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed') as any, false);
    }
    cb(null, true);
  },
});

router.use(authenticate);

/**
 * POST /api/v1/uploads/image
 * Multipart body: field `file` (image).
 * Returns { url, publicId } — store `url` on the record's image column.
 */
router.post(
  '/image',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!isCloudinaryConfigured) {
      return res.status(501).json({
        success: false,
        message:
          'File uploads are not configured on this server. Ask an admin to set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the Railway environment variables.',
      });
    }
    if (!req.file) throw new BadRequestError('No file provided');

    const folder = (req.query.folder as string) || 'salon';
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder, resource_type: 'image', transformation: [{ quality: 'auto:good' }] },
          (err, out) => (err ? reject(err) : resolve(out))
        )
        .end(req.file!.buffer);
    });

    return ApiResponse.created(res, 'Uploaded', {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    });
  })
);

export default router;

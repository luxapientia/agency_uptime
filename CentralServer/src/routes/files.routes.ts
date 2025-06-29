import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import fileService from '../services/file.service';
import logger from '../utils/logger';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// File type validation middleware
const validateFileType = (allowedTypes: string[]) => (req: any, res: any, next: any) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const ext = '.' + req.file.originalname.split('.').pop().toLowerCase();
  if (!allowedTypes.includes(ext)) {
    return res.status(400).json({
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    });
  }
  next();
};

// Upload a file
router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  validateFileType(['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx']),
  async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const subdirectory = req.body.subdirectory || '';
      const publicUrl = await fileService.saveFile(
        req.file.buffer,
        req.file.originalname,
        subdirectory
      );

      res.json({
        url: publicUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      logger.error('File upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
);

// Delete a file
router.delete(
  '/:filename',
  authenticate,
  async (req: any, res: any) => {
    try {
      const publicUrl = `/static/${req.params.filename}`;
      await fileService.deleteFile(publicUrl);
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      logger.error('File deletion error:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }
);

export default router; 